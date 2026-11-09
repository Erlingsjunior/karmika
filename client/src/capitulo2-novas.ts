/* ---------- CAPÍTULO II — "O JURAMENTO" (níveis 32–42): as missões novas que costuram as boas ideias que saíram do Capítulo I (09/11).
   Erling: "nunca perdemos missões; as que não entraram no Capítulo I são reaproveitadas e remodeladas para o II e o III; contar a história
   na visão de cada facção e de cada classe, seguindo as suas tradições e visões de mundo dentro de Karmika".
   O Capítulo II de todas as classes (fios-por-classe): jurar a bandeira em voz alta (Askavik, as duas Tecelagens), a primeira missão contra o
   outro lado, "onde o meu lado erra", a primeira podridão (culpa de Zerath) e a briga interna. Os Neutros não juram: arbitram.
   As mesmas cenas, vistas de lados diferentes (A Podridão em Grenivik é contada pelo paladino, pelo lobo, pelo vampiro e pelo bruxo, e cada
   um vê outra coisa). Pista do Capítulo II: a PORTA — sem resposta. Toda podridão é culpa de Zerath. Ninguém reconcilia ninguém. ---------- */
import type { QuestDef } from './quests';

const IG = 'Mestra Ingeborg', CV = 'Corvina, a Desfiadora', AL = 'Paladino Aldric', CS = 'Grão-Mestre Cassius', VS = 'Caçadora Vesna Helsing';
const TG = 'Thorgrim Mão-de-Ferro', BY = 'Brynhild Lâmina-Quieta';
const UL = 'Ulfrun, a Mãe-Alfa', VG = 'Varg Dente-Partido', UK = 'Ulfrik';
const MI = 'Lady Mirela', VA = 'Sommelier Vasko', VL = 'Conde Vladislav III';
const MG = 'Malgrath, Senhor dos Pactos', RV = 'Ravena Cinco-Cláusulas';
const FE = 'Irmã Felícia';
void AL; void VS; void UK;

export const CAP2_NEW: QuestDef[] = [
  /* ===== PALADINO ===== */
  { id: 'pj1', chain: '', name: 'O Juramento à Vista', lvl: 32, giver: CS, turnin: IG, xp: 0, gold: 300,
    text: 'O voto você fez na Abadia, de joelhos e em silêncio. O juramento do Fio é outra coisa: em pé, em voz alta, na Tecelagem Real de Askavik, diante da Mestra Ingeborg e de quem estiver passando.',
    objs: [{ kind: 'visit', poi: 'Askavik' }, { kind: 'talk', npc: IG }],
    talk: ['O voto é para Auréon. O juramento é para os homens. Os homens precisam ouvir, {nome}: eles esquecem o que não ouviram.', 'A Ingeborg vai tecer o seu nome num fio de ouro. Do outro lado da praça, a Corvina vai rir. Deixe que ria. Quem jura em voz alta não tem medo de riso.',
      { r: [{ t: 'E se eu errar as palavras?', a: 'Então diga de novo. Ninguém lembra quem errou. Todo mundo lembra quem não voltou.', luz: 1 }, { t: 'Por que jurar duas vezes?', a: 'Porque a primeira foi para você ficar. A segunda é para você não ir embora.' }] }],
    meet: { [IG]: [{ who: IG, t: 'De pé. Mão no tear. Repita: “Eu sou fio. Eu seguro o que está para cair.”' }, { who: IG, t: '(Do outro lado da praça, a Corvina rasga uma barra de manto e joga no vento. Ninguém olha. Todo mundo vê.)' }, { who: IG, t: 'Pronto. Seu nome está no pano. Agora o pano depende de você.' }] },
    done: ['O fio está tecido. A Ordem vai pedir mais do que pediu até agora.', 'Volte ao Grão-Mestre. E não olhe para a Corvina na saída. Ela quer que olhe.'] },
  { id: 'pj2', chain: '', name: 'Onde o Fio Erra', lvl: 40, giver: AL, turnin: CS, xp: 0, gold: 420,
    text: 'Um guardião da Ordem prendeu os aldeões de Grenivik na capela “para o bem deles”, por medo dos carniçais. A Irmã Felícia está do lado de fora, sem poder entrar na própria capela. Vá, limpe os carniçais e decida o que fazer com o guardião.',
    objs: [{ kind: 'visit', poi: 'Grenivik' }, { kind: 'kill', type: 'ghoul', n: 8 }, { kind: 'talk', npc: FE }],
    talk: ['Eu ia sozinho. O Cassius disse que não: “se o Aldric for, ele mata o guardião”. Ele tem razão. Eu mataria.', 'O Fio protege. Mas quem protege trancando a porta virou carcereiro. Vá ver com os seus olhos. A culpa, dizem, é da podridão que sobe do Atoleiro: os carniçais de Zerath deixaram todo mundo com medo.'],
    meet: { [FE]: [{ who: FE, t: 'Ele trancou a minha capela com a gente da vila dentro. Por três dias. Rezavam pela janela.' }, { who: FE, t: 'Ele não é mau. Está com medo. O medo veste o manto que encontrar.' }] },
    choice: { q: 'O guardião da Ordem que trancou a capela está na sua frente, de joelhos. Você…', opts: [
      { label: 'Abre a capela e leva o guardião à Abadia para ser julgado por Cassius.', karma: 3, flag: 'pj_julga', say: 'A porta abriu. A vila saiu chorando e rindo. O guardião foi com você em silêncio. O Cassius o ouviu a noite inteira.', why: 'Você corrigiu o erro do seu lado sem esconder e sem vingar.' },
      { label: 'Abre a capela e o deixa ir, para não manchar o nome da Ordem.', karma: -2, flag: 'pj_esconde', say: 'O nome da Ordem ficou limpo em Grenivik. Mas a Felícia viu. E a Felícia escreve cartas.', why: 'Você protegeu o manto em vez de proteger a verdade.' },
      { label: 'Deixa a vila decidir o que fazer com ele.', karma: 1, flag: 'pj_vila', say: 'A vila mandou o guardião varrer a capela por um ano. Ele varre todo dia. Ninguém tranca mais a porta.', why: 'Justiça de vila: pequena, lenta e de verdade.' } ] },
    done: ['O Fio também erra. Quem não admite isso vira a outra coisa que dizemos combater. Guarde essa noite.', { r: [{ t: 'O guardião disse que viu uma porta preta no sonho.', a: 'Muita gente da Ordem sonha com uma porta preta. Ninguém sabe onde ela fica. Não me pergunte mais.' }] }] },

  /* ===== GUERREIRO (Neutro: não jura bandeira; arbitra) ===== */
  { id: 'gc1', chain: '', name: 'Os Dois Corvos', lvl: 32, giver: TG, turnin: BY, xp: 0, gold: 300,
    text: 'O Thorgrim manda você à Brynhild: ela ensina aos guerreiros o que os dois corvos de Odin dizem. Hugin é o pensamento, o lado da ordem. Munin é a memória, o lado do sangue.',
    objs: [{ kind: 'talk', npc: BY }],
    talk: ['Odin tem dois corvos e não escolhe entre eles. Os sulistas querem que a gente escolha um lado. O Clã do Corvo não escolhe: pesa.', 'A Brynhild ensina isso melhor que eu. Ela não ri, então presta atenção no que diz.'],
    meet: { [BY]: [{ who: BY, t: 'Hugin pensa. Munin lembra. Quem só pensa vira o Fio: certo, frio, sem memória de quem pisou. Quem só lembra vira os Desfiados: quente, faminto, sem plano.' }, { who: BY, t: 'O guerreiro do Corvo fica no meio. Não por covardia. Porque o meio é o lugar mais difícil de segurar.' }] },
    done: ['As posturas de defesa e de cura vêm daqui: o corpo no meio, os dois corvos nos ombros. Vamos treinar. Mas primeiro, a forja precisa de ferro.'] },
  { id: 'gc2', chain: '', name: 'A Emissária da Noite', lvl: 35, giver: TG, turnin: CV, xp: 0, gold: 340,
    text: 'Depois do Fio, os Desfiados também querem o Clã. A Corvina, na Tecelagem dos Desfiados de Askavik, mandou chamar “o corvo que ouviu o paladino”. Vá ouvir o outro lado.',
    objs: [{ kind: 'talk', npc: CV }],
    talk: ['Ouvimos o Fio. Agora ouvimos os Desfiados. O Clã do Corvo ouve os dois e não dorme com nenhum.'],
    meet: { [CV]: [{ who: CV, t: 'O Aldric ofereceu honra. Eu ofereço outra coisa: liberdade. Ninguém amarra o Corvo nos Desfiados.' }, { who: CV, t: 'Rasgo a barra de todo manto que entra aqui. Quer ver o seu rasgado? Não? Inteligente. O Thorgrim ensinou bem.' }] },
    choice: { q: 'A Corvina oferece um pagamento em prata para o Clã vigiar as estradas da Corte. Você…', opts: [
      { label: 'Recusa, como recusou o Fio. O Clã não se vende.', karma: 2, flag: 'gc_recusa', say: 'A Corvina riu. “Dois nãos. O Corvo é caro.” Ela gosta de quem é caro.', why: 'Você manteve o Clã no meio.' },
      { label: 'Aceita só a parte de proteger viajantes, de qualquer lado.', karma: 1, flag: 'gc_viajantes', say: 'A Corvina pensou muito tempo. “Proteger quem passa. Tanto faz de que lado.” Assinou. O Thorgrim resmungou e aprovou.', why: 'Você vendeu a lâmina para o que é justo, não para um lado.' } ] },
    done: ['O Fio e os Desfiados querem a mesma lâmina. Isso diz muito sobre a lâmina e mais ainda sobre eles.'] },
  { id: 'gc3', chain: '', name: 'Os Dois Têm Razão', lvl: 38, giver: BY, turnin: BY, xp: 0, gold: 380,
    text: 'Uma briga em Askavik: um caçador do Fio e uma cria da Corte disputam um ferido que os dois dizem ter salvado. A praça pediu um guerreiro do Corvo para arbitrar. Ouça a Mestra Ingeborg e a Corvina, e decida.',
    objs: [{ kind: 'talk', npc: IG }, { kind: 'talk', npc: CV }],
    talk: ['Arbitrar não é escolher um lado. É dizer em voz alta o que os dois não querem ouvir, e ir embora antes da resposta. É o mais difícil que um guerreiro faz.'],
    meet: { [IG]: [{ who: IG, t: 'O caçador tirou o ferido da estrada. Sem ele, o homem morria. Ponto.' }], [CV]: [{ who: CV, t: 'A cria deu o próprio sangue para fechar a ferida. Sem ela, o homem morria. Ponto.' }] },
    choice: { q: 'Diante das duas Tecelagens, você arbitra…', opts: [
      { label: '“Os dois salvaram. O ferido não é de ninguém.” E vai embora.', karma: 3, flag: 'gc_ninguem', say: 'As duas Tecelagens ficaram bravas com você. Ao mesmo tempo. A Brynhild disse que foi a melhor arbitragem do inverno.', why: 'Você disse o que nenhum dos lados queria ouvir: a verdade.' },
      { label: 'Dá razão ao Fio: o caçador chegou primeiro.', karma: 0, flag: 'gc_fio', say: 'A Ingeborg agradeceu. A Corvina rasgou a barra do seu manto com um sorriso.', why: 'Você pendeu para Hugin. O corvo do pensamento é útil, mas pesa num ombro só.' },
      { label: 'Dá razão à Corte: o sangue fechou a ferida.', karma: 0, flag: 'gc_corte', say: 'A Corvina ficou surpresa. A Ingeborg não falou com você o resto do mês.', why: 'Você pendeu para Munin. O corvo da memória lembra de quem sangrou.' } ] },
    done: ['Saiu antes da resposta? Saiu. Bom. Corvo que fica para ouvir aplauso vira galinha.'] },
  { id: 'gc4', chain: '', name: 'Hugin e Munin', lvl: 40, giver: BY, turnin: BY, xp: 0, gold: 420, gear: 1,
    text: 'A Brynhild leva você ao rochedo dos corvos, ao norte de Jarlsheim. Os dois corvos do Clã descem quando alguém pesa uma escolha de verdade. Sinta a presença deles com o Faro.',
    objs: [{ kind: 'sense', what: 'espirito', label: 'Os dois corvos no rochedo', at: 'Jarlsheim', dx: 10, dy: -16, spirit: { name: 'Hugin e Munin', lines: ['Hugin: “Você pensou antes de cortar?”', 'Munin: “Você lembrou de quem cortou?”', 'Os dois, juntos: “Então siga. O meio é seu.”'] } }],
    talk: ['Uma vez por vida, os corvos falam com um guerreiro. Comigo falaram no dia em que o Halfdan fugiu. Disseram que eu ia ficar. Fiquei.'],
    done: ['Eles falaram com você. Eu vi pelo seu rosto. Não me conte o que disseram: é seu.', { r: [{ t: 'Eles mostraram uma porta preta, no fundo de um corredor.', a: 'Então você também viu. A minha mãe viu. Ninguém do Clã sabe onde ela fica. Os corvos nunca entram lá.' }] }] },
  { id: 'gc5', chain: '', name: 'Entre os Corvos', lvl: 42, giver: BY, turnin: TG, xp: 0, gold: 520, gear: 2, title: 'Voz dos Dois Corvos',
    text: 'O Thorgrim, velho e doente, quer ouvir de você o que os dois lados ofereceram e o que você respondeu. Derrube os carniçais que rondam a Fortaleza e vá ao salão.',
    objs: [{ kind: 'kill', type: 'ghoul', n: 8 }, { kind: 'talk', npc: TG }],
    talk: ['O velho está esperando. Ele vai fingir que não está. Ninguém finge pior que o Thorgrim.'],
    meet: { [TG]: [{ who: TG, t: 'O Fio pediu. Os Desfiados pediram. Você pesou, arbitrou, falou com os corvos. Agora fale comigo.' }, { who: TG, t: 'Quando eu for para Valhalla, o Clã vai precisar de quem segure o meio. Não precisa ser você. Mas pode ser.' }] },
    done: ['O Clã do Corvo não escolhe. Pesa. E agora o Clã sabe o seu peso.'] },

  /* ===== LOBISOMEM ===== */
  { id: 'lj1', chain: '', name: 'O Uivo na Tecelagem', lvl: 32, giver: UL, turnin: CV, xp: 0, gold: 300,
    text: 'A matilha jura à bandeira dos Desfiados na Tecelagem de Askavik. O Varg vai junto “para ajudar”. A Mãe-Alfa já pediu desculpas à Corvina por antecipação.',
    objs: [{ kind: 'visit', poi: 'Askavik' }, { kind: 'talk', npc: CV }],
    talk: ['Jurar na cidade é jurar diante de gente que não cheira a mato. Seja educado. Não fareje ninguém. E, por favor, segure o Varg.'],
    meet: { [CV]: [{ who: CV, t: 'Repita: “Eu sou desfiado. Ninguém me amarra.”' }, { who: CV, t: '(O Varg, no meio do juramento, uiva. A Tecelagem inteira treme. A Corvina fecha os olhos e conta até dez.)' }, { who: CV, t: 'Fora. Os dois. O juramento vale, o uivo não. Fora!' }] },
    done: ['Expulsos no dia do juramento. A matilha vai contar essa história por cem luas. O Varg está orgulhosíssimo.'] },
  { id: 'lj2', chain: '', name: 'A Trégua da Lua', lvl: 38, giver: UL, turnin: MI, xp: 0, gold: 380,
    text: 'Noite dos Desfiados em Corvoscuro: a Casa do Conde e a matilha jantam à mesma mesa pela primeira vez. A trégua dura uma lua. O Varg vai. Você vai junto para ele não comer ninguém.',
    objs: [{ kind: 'talk', npc: MI }],
    talk: ['Uma lua de trégua com os sanguessugas. Eles odeiam a gente; a gente odeia eles. Mas os dois odiamos mais quem acende fogueira de prata.', 'Vá, coma em silêncio, e traga o Varg de volta inteiro. E sem morder o sommelier.'],
    meet: { [MI]: [{ who: MI, t: 'O seu companheiro está comendo o arranjo de mesa. Não, tudo bem. Era carne. Por isso.' }, { who: MI, t: '(O Sommelier Vasko serve o Varg do lado de fora, numa tigela de prata. Pede desculpas pela prata. Não parece arrependido.)' }] },
    choice: { q: 'No fim do jantar, o Vasko provoca o Varg pela tigela de prata. O Varg rosna. Você…', opts: [
      { label: 'Segura o Varg e agradece o jantar.', karma: 2, flag: 'lj_segura', say: 'O Varg rosnou o caminho inteiro de volta. Depois admitiu que o vinho era bom.', why: 'A trégua sobreviveu à primeira noite. Isso é raro.' },
      { label: 'Deixa o Varg derrubar a tigela da mão do Vasko.', karma: -1, flag: 'lj_derruba', say: 'A tigela voou. A Mirela riu pela primeira vez em um século. O Vasko não. A trégua durou, mas com cicatriz.', why: 'Orgulho de lobo. A Casa anota cada um.' } ] },
    done: ['Uma lua. Depois, cada um volta a ser o que é. Mas hoje ninguém morreu, e isso vale uma história.'] },
  { id: 'lj3', chain: '', name: 'Onde a Boca Erra', lvl: 39, giver: UL, turnin: UL, xp: 0, gold: 400,
    text: 'Um lobo das ninhadas arrastou um aldeão de Lundr até a boca da mata. Não matou: ainda. A matilha dos Desfiados também erra. Siga o rastro e decida.',
    objs: [{ kind: 'visit', poi: 'Lundr' }, { kind: 'sense', what: 'cheiro', label: 'O rastro do aldeão arrastado até a mata', at: 'Lundr', dx: -12, dy: 9 }],
    talk: ['A primeira lei da matilha: o que se mata, se come; o que se come, se divide. Quem arrasta gente por diversão não está comendo. Está doente.', 'Os Desfiados dizem que ninguém nos amarra. Às vezes isso quer dizer que ninguém nos segura. Vá.'],
    choice: { q: 'O lobo jovem segura o aldeão vivo, com medo do que fez. Você…', opts: [
      { label: 'Solta o aldeão e leva o lobo de volta à Mãe-Alfa.', karma: 3, flag: 'lj_leva', say: 'O aldeão correu para a capela sem olhar para trás. O lobo foi com você de cabeça baixa. A Ulfrun o mandou cuidar dos filhotes por uma estação.', why: 'Você corrigiu o erro do seu lado sem matar o seu.' },
      { label: 'Deixa o lobo terminar: a lua mandou.', karma: -5, flag: 'lj_lua', say: 'A capela de Lundr tocou o sino à toa naquela noite. Na manhã seguinte, a Abadia mandou um paladino.', why: 'Você culpou a lua pelo que a boca fez.' } ] },
    done: ['Os Desfiados não têm dono. Mas a matilha tem lei. Quem esquece a lei esquece que é matilha.'] },
  { id: 'lj4', chain: '', name: 'A Podridão em Grenivik (pelo faro)', lvl: 40, giver: VG, turnin: VG, xp: 0, gold: 420, gear: 1,
    text: 'Os carniçais de Grenivik cheiram a algo que o Varg nunca sentiu: podridão de dentro da terra. Derrube oito e fareje de onde vem.',
    objs: [{ kind: 'visit', poi: 'Grenivik' }, { kind: 'kill', type: 'ghoul', n: 8 }, { kind: 'sense', what: 'cheiro', label: 'A podridão que sobe da terra', at: 'Grenivik', dx: 8, dy: 10 }],
    talk: ['Paladino vê carniçal e reza. Lobo vê carniçal e fareja. Esses aí cheiram a lama velha, de lugar que nunca viu lua.', 'Os velhos chamam isso de Zerath. Eu chamo de nojo. Dá no mesmo.'],
    done: ['Vem do sul. Do Atoleiro. Zerath respira debaixo de tudo, até debaixo das capelas dos paladinos.', { r: [{ t: 'O cheiro parava numa porta de pedra enterrada.', a: 'Uma porta? Preta? Não. Não quero saber. Faro bom sabe quando parar de farejar.' }] }] },
  { id: 'lj5', chain: '', name: 'Uivo de Duas Matilhas', lvl: 42, giver: VG, turnin: UL, xp: 0, gold: 520, gear: 2, title: 'Uivo de Duas Matilhas',
    text: 'Selvar e o Uivo Antigo vão correr juntos pela primeira vez em duzentos anos. Antes, seis lobos gélidos de Selvar testam quem chega. Derrube-os e volte à Mãe-Alfa.',
    objs: [{ kind: 'kill', type: 'frostwolf', n: 6 }, { kind: 'talk', npc: UL }],
    talk: ['O Ulfrik aceitou correr com a gente. Uma lua. Uma só. Vamos fazer valer.'],
    meet: { [UL]: [{ who: UL, t: 'Hoje Selvar e o Uivo Antigo correm juntos. Você correu na frente das duas matilhas. Isso não se esquece na mata.' }] },
    done: ['As duas matilhas uivam juntas. Olhe o céu. Duzentos anos de silêncio, e foi você que abriu a boca primeiro.'] },

  /* ===== VAMPIRO ===== */
  { id: 'vj1', chain: '', name: 'A Barra Rasgada', lvl: 32, giver: MI, turnin: CV, xp: 0, gold: 300,
    text: 'A Casa jura à bandeira dos Desfiados na Tecelagem de Askavik, à noite. A Corvina rasga a barra do seu manto: ninguém amarra quem é da Casa.',
    objs: [{ kind: 'visit', poi: 'Askavik' }, { kind: 'talk', npc: CV }],
    talk: ['Askavik é terra de paz. Ninguém se fere lá dentro. Por isso a Casa jura lá: é o único lugar onde os caçadores não podem nos tocar enquanto falamos alto.', 'Vista o melhor manto. A Corvina vai rasgá-lo. É a tradição. E é por isso que vestimos o melhor.'],
    meet: { [CV]: [{ who: CV, t: 'Repita: “Eu sou desfiado. Ninguém me amarra.”' }, { who: CV, t: '(Ela rasga a barra do seu manto com as unhas. O pano é caro. O gesto, mais ainda.)' }] },
    done: ['A barra rasgada é o seu brasão agora. Os do Fio vão ver e saber. É a ideia.'] },
  { id: 'vj2', chain: '', name: 'A Trégua da Lua (pela Casa)', lvl: 37, giver: MI, turnin: MI, xp: 0, gold: 380,
    text: 'Noite dos Desfiados em Corvoscuro: a Casa recebe a matilha à mesa por uma lua. Ajude o Vasko a servir sem que ninguém morda ninguém.',
    objs: [{ kind: 'talk', npc: VA }],
    talk: ['Lobos à mesa. O Conde aceitou porque os caçadores acendem fogueira de prata para os dois. Inimigo comum é o melhor tempero.', 'Ajude o Vasko. Ele vai servir o Varg do lado de fora, numa tigela de prata. Tente impedir. Ou não. Eu quero ver o que você escolhe.'],
    meet: { [VA]: [{ who: VA, t: 'Uma tigela de prata para o convidado peludo. Uma questão de estilo, não de ofensa. Quase nada de ofensa.' }] },
    choice: { q: 'O Vasko vai servir o lobo numa tigela de prata. Você…', opts: [
      { label: 'Troca a tigela por uma de barro, sem ninguém ver.', karma: 2, flag: 'vj_barro', say: 'O Varg comeu sem saber de nada. O Vasko percebeu e sorriu: “Gentileza com quem não merece. Muito Casa.”', why: 'Você protegeu a trégua das pequenas crueldades da sua própria gente.' },
      { label: 'Deixa a prata. A Casa não se curva aos cães.', karma: -2, flag: 'vj_prata', say: 'O Varg sentiu a prata e rosnou. A trégua durou, mas os lobos foram embora com fome e com memória.', why: 'Orgulho da Casa. Custa caro numa trégua.' } ] },
    done: ['Uma lua sem mortes. O Conde não comentou. O Conde não comentar é o maior elogio que existe.'] },
  { id: 'vj3', chain: '', name: 'Onde a Boca Erra (pela Casa)', lvl: 38, giver: MI, turnin: MI, xp: 0, gold: 400,
    text: 'Uma cria da Casa quebrou as regras: arrastou um aldeão de Lundr até a boca, e bebeu de inocente. A Casa também erra. Siga o sangue.',
    objs: [{ kind: 'visit', poi: 'Lundr' }, { kind: 'sense', what: 'sangue', label: 'O sangue do aldeão de Lundr, no caminho da mata', at: 'Lundr', dx: 11, dy: -8 }],
    talk: ['A Casa bebe de bicho, de quem consente e de quem tentou nos matar. Nunca de inocente. Uma cria esqueceu. Isso é pior do que um caçador: é um de nós dando razão a eles.'],
    choice: { q: 'A cria, assustada, ainda segura o aldeão desmaiado. Você…', opts: [
      { label: 'Salva o aldeão e leva a cria à senhora Mirela.', karma: 3, flag: 'vj_leva', say: 'O aldeão acordou na capela sem lembrar de nada. A cria passou um mês servindo vinho ao Vasko. É o castigo mais longo da Casa.', why: 'Você corrigiu o erro dos seus sem matar os seus.' },
      { label: 'Termina o que a cria começou: sem testemunha, sem caçador.', karma: -6, flag: 'vj_termina', say: 'Ninguém em Lundr soube. A Mirela soube. Ela olhou para você como olha para o sol.', why: 'Você escondeu um erro com outro maior.' } ] },
    done: ['A Casa não tem vila, mas tem regra. Quem bebe de inocente bebe contra todos nós.'] },
  { id: 'vj4', chain: '', name: 'A Podridão em Grenivik (pelo sangue)', lvl: 39, giver: MI, turnin: VA, xp: 0, gold: 420, gear: 1,
    text: 'O sangue dos carniçais de Grenivik não serve nem para os morcegos: é podre de dentro. A Casa quer saber o que está apodrecendo a comida do mundo. Derrube oito e leve uma amostra ao Vasko.',
    objs: [{ kind: 'visit', poi: 'Grenivik' }, { kind: 'kill', type: 'ghoul', n: 8 }],
    talk: ['Os paladinos acham que os carniçais são nossos. Não são. Nós não comemos podre. Alguém está estragando o mundo, e o mundo é a nossa adega.'],
    done: ['(O Vasko cheira a amostra e afasta o rosto.) Zerath. Ninguém da Casa toca nisso. Nem o Conde. Especialmente o Conde.', { r: [{ t: 'Os carniçais saíam de uma porta enterrada.', a: 'Uma porta preta, imagino. Eu também sirvo vinhos que ninguém deveria abrir. Esta, deixe fechada.' }] }] },
  /* ===== BRUXO ===== */
  { id: 'bj1', chain: '', name: 'Assinado na Tecelagem', lvl: 32, giver: MG, turnin: CV, xp: 0, gold: 300,
    text: 'O bruxo jura à bandeira dos Desfiados na Tecelagem de Askavik. Malgrath manda você levar um contrato de adesão. A Corvina não assina contrato nenhum: rasga.',
    objs: [{ kind: 'visit', poi: 'Askavik' }, { kind: 'talk', npc: CV }],
    talk: ['Os Desfiados juram em voz alta e rasgam mantos. Eu prefiro papel. Leve este: três cláusulas, as mais curtas que já escrevi. A Ravena vai ficar com inveja.', { r: [{ t: 'E se a Corvina não assinar?', a: 'Ela não vai. Ela vai rasgar. É o que ela faz. O rasgo é a assinatura dela. Eu já contei com isso na cláusula dois.', sombra: 1 }] }],
    meet: { [CV]: [{ who: CV, t: 'Um contrato? Para entrar nos Desfiados? O Malgrath tem senso de humor.' }, { who: CV, t: '(Ela rasga o papel em três pedaços, um por cláusula, e devolve.) Pronto. Ninguém te amarra. Nem ele.' }] },
    done: ['Rasgou em três? Exatamente como a cláusula dois previa. Você é desfiado, e eu tenho um recibo.'] },
  { id: 'bj2', chain: '', name: 'O Contrato da Trégua', lvl: 34, giver: RV, turnin: RV, xp: 0, gold: 340,
    text: 'A Casa do Conde e a matilha vão jantar juntas por uma lua. Alguém precisa escrever a trégua. A Ravena escreve; você leva o rascunho à Lady Mirela e ao Varg Dente-Partido.',
    objs: [{ kind: 'talk', npc: MI }, { kind: 'talk', npc: VG }],
    talk: ['Vampiro e lobo são crianças. Crianças precisam de contrato com desenho. Cinco cláusulas: ninguém morde, ninguém fareja, ninguém traz prata, ninguém sai antes da sobremesa, e quem quebrar paga ao Vale.', 'A quinta é a que importa. As outras eles vão quebrar.'],
    meet: { [MI]: [{ who: MI, t: 'Cinco cláusulas. A Ravena escreve como quem corta unha. Assino. A quinta me diverte.' }], [VG]: [{ who: VG, t: '“Ninguém fareja”? Como é que eu vou saber o que estou comendo? Risca essa. Não? Tá. Assino com a pata.' }] },
    done: ['As duas assinaturas. Uma de tinta vermelha, uma de pata. Quando quebrarem, e vão quebrar, o Vale recebe dos dois.'] },
  { id: 'bj3', chain: '', name: 'Onde a Boca Erra (pelo Vale)', lvl: 37, giver: RV, turnin: RV, xp: 0, gold: 380,
    text: 'Um bruxo do Vale cobrou uma dívida com a sombra de uma criança de Lundr, e não com a própria. É o crime que Malgrath mais odeia. Ache o rastro e decida.',
    objs: [{ kind: 'visit', poi: 'Lundr' }, { kind: 'sense', what: 'espirito', label: 'A sombra roubada da criança de Lundr', at: 'Lundr', dx: -9, dy: -10, spirit: { name: 'Sombra Roubada', lines: ['Eu sou o escuro de uma menina. Ela não faz mais sombra ao meio-dia.', 'Me leve de volta. Ou me guarde. Mas não me venda.'] } }],
    talk: ['O bruxo paga com a própria sombra. Nunca com a dos outros. Um dos nossos esqueceu. Pior: lembrou e fez assim mesmo.', 'Os Desfiados dizem que ninguém nos amarra. Isso não quer dizer que podemos amarrar os outros.'],
    choice: { q: 'A sombra roubada está nas suas mãos. Você…', opts: [
      { label: 'Devolve a sombra à menina e entrega o bruxo à Ravena.', karma: 4, flag: 'bj_devolve', say: 'A menina voltou a ter sombra ao meio-dia. O bruxo perdeu a dele por um ano. A Ravena chamou isso de “juros justos”.', why: 'Você corrigiu o erro dos seus e cobrou do culpado.' },
      { label: 'Guarda a sombra: é moeda boa no Vale.', karma: -6, flag: 'bj_guarda', say: 'A sombra é sua agora. Ela pesa no bolso. A menina de Lundr anda à luz do dia e ninguém sabe por que ela tem medo de espelho.', why: 'Você fez exatamente o que o Vale proíbe.' } ] },
    done: ['Nunca com a sombra dos outros. É a única regra que nem o Malgrath negocia.'] },
  { id: 'bj4', chain: '', name: 'A Podridão em Grenivik (pela letra)', lvl: 39, giver: RV, turnin: RV, xp: 0, gold: 420, gear: 1,
    text: 'Os carniçais de Grenivik carregam papéis no peito: pactos sem patrono, de letra bonita demais. A Ravena quer um. Derrube oito e traga.',
    objs: [{ kind: 'visit', poi: 'Grenivik' }, { kind: 'kill', type: 'ghoul', n: 8 }],
    talk: ['Paladino vê carniçal e reza. Lobo fareja. Vampiro torce o nariz. Bruxo lê. Alguém está assinando pelos mortos, e eu quero ver a letra.'],
    done: ['(A Ravena lê o pacto do carniçal. Não ri.) Letra bonita. A mesma dos Pactos Rompidos do Vale. Os velhos dizem que é Zerath imitando os patronos.', { r: [{ t: 'No verso, o desenho de uma porta.', a: 'Uma porta preta, sem maçaneta. Já vi esse desenho no arquivo do Malgrath. Ele cobre com a mão quando eu chego perto.' }] }] },
  { id: 'bj5', chain: '', name: 'A Cláusula Quebrada', lvl: 42, giver: RV, turnin: MG, xp: 0, gold: 520, gear: 2, title: 'Cobrador da Trégua',
    text: 'A trégua da lua quebrou: um lobo mordeu um criado do Conde, e o Conde mandou prata para a mata. A quinta cláusula diz que quem quebra paga ao Vale. Cobre dos dois e leve a cobrança ao Malgrath.',
    objs: [{ kind: 'talk', npc: VL }, { kind: 'talk', npc: UL }, { kind: 'talk', npc: MG }],
    talk: ['Eu disse que iam quebrar. Quebraram os dois na mesma noite. Que eficiência.', 'Cobre do Conde e da Mãe-Alfa. Os dois vão dizer que o outro começou. Os dois estão certos. Os dois pagam.'],
    meet: { [VL]: [{ who: VL, t: 'O Vale cobra do Conde? Que ousadia. Pague-se. Mas diga à menina das cinco cláusulas que o Conde lembra.' }], [UL]: [{ who: UL, t: 'Pagar por um dente? Pago. A matilha cumpre o que a pata assinou. Mas a prata do Conde, quem cobra?' }], [MG]: [{ who: MG, t: 'Dos dois. Na mesma noite. A Ravena escreveu bem.' }, { who: MG, t: 'Nunca diga isso a ela. Ela vai querer aumento.' }] },
    done: ['O Vale cobrou dos Desfiados como cobra de qualquer um. É por isso que os Desfiados confiam em nós: não temos amigos, só clientes.'] },
];
