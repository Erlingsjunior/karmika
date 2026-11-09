/* ---------- AS ESTRADAS DOS POVOS (09/11, Erling: "missões para elfos e licantropos — e para todas as raças — que o façam ir de vila em vila:
   exploração e abertura de mapas"). Quatro cadeias de viagem, abertas a qualquer caminhante, que levam a palavra do líder do povo de uma vila
   pequena à outra (as vilas novas de 09/11) e voltam ao líder. Cada parada: chegar à vila (o mapa se abre) e falar com quem a lidera.
   - A Voz das Folhas (elfos): a Anciã Faelwen manda; sete vilas élficas.
   - O Uivo de Vila em Vila (licantropos): a Mãe-Alfa Ulfrun manda; sete ninhadas.
   - O Censo da Montanha (anões): o Thane Borin manda; sete vilas anãs.
   - O Tributo do Gelo (nórdicos): o Jarl Sigurd de Jarlsheim manda; dez vilas nórdicas e do gelo.
   Pista do mistério (sem resposta, regra do Capítulo I): em cada cadeia, uma parada cita a sexta runa. ---------- */
import type { QuestDef } from './quests';

type Stop = [village: string, leader: string, line: string];
const JARL = 'Jarl Sigurd de Jarlsheim';

const ROUTES: { id: string; chain: string; boss: string; lvl0: number; lvl1: number; open: string; close: string; title: string; stops: Stop[] }[] = [
  { id: 'xe', chain: 'A Voz das Folhas', boss: 'Anciã Faelwen', lvl0: 8, lvl1: 34, title: 'Folha Que Anda', open: 'A Copa tem sete vilas pequenas pela mata, e a palavra da Rainha não chega a todas. Leve-a, de vila em vila.', close: 'Sete vilas, sete líderes, e você voltou com todas as palavras. A mata agora conhece o seu passo.', stops: [
    ['Tirnael', 'Capitã Faenor', 'As torres viram você chegar há uma hora. Bem-vindo. A Rainha manda dizer que a fronteira dos goblins é sua também.'],
    ['Lindorië', 'Tecelã Nerwen', 'A Rainha pede seda? Sempre pede. Leve este fio à próxima vila: é o recado de que estamos bem.'],
    ['Elendor-das-Cinzas', 'Mago Ithron Cinza-Clara', 'Uma palavra da Copa. E uma pergunta minha, que você não precisa responder: por que a sexta runa está desenhada no nosso poço, se ninguém daqui a desenhou?'],
    ['Nimbrethil', 'Curandeira Ilyra', 'Chegou inteiro. Bom. Aqui quem chega inteiro sai calado. Leve a palavra adiante.'],
    ['Lómenor-do-Lago', 'Barqueira Siriel', 'O Velho do Lago cantou ontem. Diga à Rainha que alguém respondeu. Não fomos nós.'],
    ['Sereth', 'Cantora Ylmeth', 'A Rainha mandou você ouvir a nossa canção. Ouça. Ela também para na mesma estrofe.'],
    ['Morthil', 'Senhora Vaelith Mão-Escura', 'A voz da Copa em Morthil. Raro. Diga à Rainha que a ordem escura está em paz. E que ninguém aqui foi mordido.'] ] },
  { id: 'xw', chain: 'O Uivo de Vila em Vila', boss: 'Ulfrun, a Mãe-Alfa', lvl0: 42, lvl1: 50, title: 'Mensageiro da Matilha', open: 'Sete ninhadas vivem fiéis a mim pela selva. Leve o meu cheiro a cada uma. Quem leva o cheiro da Mãe é protegido por todas.', close: 'Todas as ninhadas sentiram o meu cheiro em você. Agora a selva inteira sabe quem você é.', stops: [
    ['Ninhada do Rio Torto', 'Mãe da Ninhada Bragha', 'O cheiro da Grande Mãe. Entre. Os filhotes não mordem. Muito.'],
    ['Ninhada da Pedra Rachada', 'Pai da Ninhada Gorm', 'Família pequena, dente grande. Diga à Mãe que o Varg passou e chorou pelos filhotes da prata. Ele não sabe que eu vi.'],
    ['Ninhada do Charco Fundo', 'Mãe da Ninhada Orla', 'O charco esconde o cheiro, mas não o da Grande Mãe. Siga.'],
    ['Ninhada das Três Luas', 'Mãe da Ninhada Tamsin', 'Os três filhotes têm uma marca na orelha. Seis riscos. Ninguém fez. Diga à Mãe-Alfa. Ela vai ficar quieta.'],
    ['Ninhada do Osso Branco', 'Pai da Ninhada Varn', 'Ossos de caçador na entrada. Não toque. Leve o recado: a ninhada está forte.'],
    ['Ninhada da Clareira Calada', 'Mãe da Ninhada Silke', '(Ela só fala baixo.) A clareira é calada pelos que caíram. Diga à Grande Mãe que lembramos.'],
    ['Ninhada do Vento Norte', 'Pai da Ninhada Ulric', 'Os humanos de Dalborg cheiram a medo e tocha. Diga à Mãe que a fronteira aguenta.'] ] },
  { id: 'xd', chain: 'O Censo da Montanha', boss: 'Thane Borin Barba-Longa', lvl0: 14, lvl1: 34, title: 'Contador de Bigodes', open: 'O Rei quer o censo das vilas da montanha: quantos anões, quantos malhos, quantas promessas. Vá contar. Conte direito.', close: 'Sete vilas contadas. O Rei vai ler o número e dizer “pouco”. É o jeito dele de dizer obrigado.', stops: [
    ['Kolgrof', 'Mestre-Carvoeiro Dvalin Pó-Preto', 'Censo? Somos quarenta e dois. Quarenta e três, se contar o carvão que fala.'],
    ['Skarnbrú', 'Guarda-Ponte Bofur Pedágio', 'Você paga o pedágio e eu conto. Uma moeda por perna. Você tem duas.'],
    ['Hamarvik', 'Mestre-Ferreiro Brokk Malho-Duplo', 'Trinta e um anões, sessenta malhos. Cada anão tem dois. Um para trabalhar, outro para discutir.'],
    ['Steinhöll', 'Thane Sindri Pedra-Viva', 'Conte a rocha também. Ela chegou antes de nós.'],
    ['Djúpgröf', 'Guardiã do Poço Hrefna Funda', 'Somos vinte. E alguém lá embaixo. Não conte esse. O Rei não quer saber. A grade tem a sexta runa, igual à porta das galerias.'],
    ['Eldhús', 'Mestra-Fundidora Bryndís Brasa', 'A fornalha conta como um. Ela come mais que três.'],
    ['Járnhlið', 'Capitão do Portão Thorin Elo-de-Ferro', 'Somos dezoito, e o ferro que passa por aqui pesa o mesmo para o Fio e para os Desfiados. Escreva isso no censo.'] ] },
  { id: 'xn', chain: 'O Tributo do Gelo', boss: JARL, lvl0: 10, lvl1: 30, title: 'Voz do Jarl', open: 'As vilas do gelo me pagam tributo e eu as protejo do inverno e dos draugr. Vá a cada uma, receba a palavra delas e lembre a todas quem manda no norte.', close: 'Dez vilas, dez palavras. O norte inteiro agora conhece a voz do Jarl na sua boca. Use com cuidado: ela pesa.', stops: [
    ['Corvanes', 'Chefe Ragnhild Asa-Negra', 'O Jarl mandou você? Os corvos já tinham avisado. Diga a ele que Corvanes alimenta os corvos dele.'],
    ['Hrossbú', 'Criador Hallvard', 'Os cavalos do Jarl estão gordos e teimosos. Prontos para a guerra, ou para o inverno.'],
    ['Selvatn', 'Chefe Gudrun Mão-Fria', 'O lago vai congelar. O tributo vai pela estrada de gelo, como sempre.'],
    ['Ísholm', 'Chefe Eyvindr Barba-de-Gelo', 'Diga ao Jarl que Ísholm obedece com neve até o joelho.'],
    ['Frostvík', 'Chefe Áslaug Mar-Branco', 'Os barcos dormem. O tributo vai em peixe seco. O Jarl detesta peixe seco. Mande mesmo assim.'],
    ['Hvítfell', 'Pastor Hallgrímur', 'Queijo de cabra para o Jarl. Ele reclama do cheiro e come tudo.'],
    ['Snæbú', 'Chefe Thordís Meio-Enterrada', 'Os draugr passaram de novo, e não nos viram. Diga ao Jarl que as casas enterradas funcionam.'],
    ['Ulfsbrekka', 'Chefe Ulfar Pele-de-Lobo', 'Peles de lobo gélido para o salão do Jarl. A cerca aguentou mais um inverno.'],
    ['Kaldheim', 'Skald-Mor Bragi Voz-de-Vento', 'O vento disse uma palavra estranha ontem, em nórdico antigo. Uma palavra sem nome, como a sexta runa. Diga ao Jarl que eu não traduzi.'],
    ['Jökulvík', 'Chefe Sigríd Pé-na-Geleira', 'A geleira avançou um palmo. Nós recuamos um passo. Diga ao Jarl que é estratégia.'] ] },
];

export const ROADS_OF_PEOPLES: QuestDef[] = ROUTES.flatMap((R) => {
  const n = R.stops.length, out: QuestDef[] = [];
  R.stops.forEach(([vila, lead, line], i) => {
    const lvl = Math.round(R.lvl0 + (R.lvl1 - R.lvl0) * i / n), giver = i === 0 ? R.boss : R.stops[i - 1][1];
    out.push({ id: `${R.id}${i + 1}`, chain: R.chain, name: `${vila}`, lvl, giver, turnin: lead, next: `${R.id}${i + 2}`, xp: 0, gold: 60 + lvl * 6,
      text: `${i === 0 ? R.open + ' ' : ''}Vá até ${vila} e fale com ${lead}.`, objs: [{ kind: 'visit', poi: vila }, { kind: 'talk', npc: lead }],
      /* 09/11 (regra 0: toda missão tem diálogo ao pegar e ao entregar): quem manda adiante fala também */
      talk: i === 0 ? [R.open, 'Comece por ' + vila + '. Depois cada líder lhe diz para onde ir.'] : [`Vai para ${vila}? Leve isto também: diga a ${lead.split(' ').slice(-1)[0] === lead ? lead : lead} que ${R.stops[i - 1][0]} está de pé e lembra de quem manda.`, `A estrada até lá é ${['curta', 'longa', 'traiçoeira', 'bonita', 'fria', 'quieta', 'barulhenta'][(i + R.id.length) % 7]}. Não pare no escuro.`],
      done: [line, i < n - 1 ? `A próxima é ${R.stops[i + 1][0]}. Fale com ${R.stops[i + 1][1]}.` : `Volte a ${R.boss}. Você andou o caminho inteiro.`] });
  });
  out.push({ id: `${R.id}${n + 1}`, chain: R.chain, name: `De volta a ${R.boss.split(',')[0]}`, lvl: R.lvl1, giver: R.stops[n - 1][1], turnin: R.boss, xp: 0, gold: 120 + R.lvl1 * 10, gear: 1, title: R.title,
    text: `Volte a ${R.boss} com as palavras das ${n} vilas.`, objs: [{ kind: 'talk', npc: R.boss }], done: [R.close] });
  return out;
});

export const ROADS_NPCS = [
  { vila: 'Jarlsheim', name: JARL, role: 'Jarl de Jarlsheim · Senhor do Norte', dx: -3, dy: -4, tint: 0x3a4a7a, lines: ['O inverno manda em todo mundo. Eu mando no inverno. Mais ou menos.', 'As vilas do gelo me pagam em queijo, peixe e peles. Eu pago em espada.', 'Odin olha por cima do meu ombro. Eu finjo que não sinto.'] },
];
