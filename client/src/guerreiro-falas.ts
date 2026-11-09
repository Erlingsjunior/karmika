/* AS FALAS DO GUERREIRO (09/11, Erling: "precisa ler as falas de ponta a ponta; resquícios de textos antigos não devem ficar, isso é bug dos
   feios"). As missões antigas do Clã do Corvo (w01–w10) não tinham conversa ao pegar nem ao entregar (regra 0). Aqui elas ganham a voz do
   Thorgrim no Capítulo I e, no Capítulo II, a voz da Brynhild: depois de "Valhalla Espera" o velho ou foi com as valquírias ou está na cama
   dos curandeiros resmungando — de um jeito ou de outro, o pátio da Fortaleza é dela. */
import type { QuestDef } from './quests';

type Fala = Partial<Pick<QuestDef, 'text' | 'talk' | 'done' | 'giver' | 'turnin' | 'objs' | 'meet'>>;
const BY = 'Brynhild Lâmina-Quieta', JARL = 'Jarl Sigurd de Jarlsheim';

export const FALAS_GUERREIRO: Record<string, Fala> = {
  /* ---------- Capítulo I (Thorgrim) ---------- */
  w01: {
    talk: ['A Vidente mandou você. Ela manda muita gente. Metade volta para casa no primeiro inverno.', 'O Clã do Corvo não é um exército. É uma promessa feita no frio por gente que podia estar no quente.',
      { r: [{ t: 'O que é preciso para jurar?', a: 'Mãos que não tremem diante de um lobo gélido. Oito deles. O resto a gente vê depois.' }, { t: 'Por que o corvo?', a: 'Odin tem dois. Um pensa, o outro lembra. Um dia a Brynhild explica. Eu só sei bater.' }] }],
    done: ['Oito. As mãos tremeram? Não minta. Tremeram. As minhas também tremem até hoje. Agora a pedra de Odin.', 'Diga o seu juramento. Ele vai pesar até o dia em que você morrer, e um pouco depois.'] },
  w02: {
    talk: ['Skjoldvik mandou um corvo de verdade: os barcos-dragão estão presos no fiorde. Uma alcateia desceu da montanha e cerca o cais.', 'Pescador com fome é pescador perigoso. Vá antes que eles resolvam sozinhos e percam metade.'],
    done: ['Os barcos saíram ao amanhecer. Um velho de Skjoldvik mandou um peixe seco para você. É a maior honra que eles conhecem. Coma.'] },
  w03: {
    talk: ['Agora a parte que eu odeio. Halfdan, um dos nossos, largou o posto da muralha e fugiu para Fjallbrún.', 'A lei do Clã diz que desertor responde com a vida. A lei não diz quem tem que cobrar. Hoje é você.',
      { r: [{ t: 'Por que ele fugiu?', a: 'Não sei. Não perguntei. É isso que me incomoda.' }, { t: 'E se eu não conseguir?', a: 'Então volte e diga. Mentir sobre isso pesa mais do que a espada.' }] }] },
  w08: {
    talk: ['Sigurd, o Ruivo, campeão de Hrimgard, desafiou o meu aprendiz. Isso quer dizer você. Ele quer saber se o Clã ainda forma gente.', 'Os lobos gélidos guardam o círculo do duelo. Passe por eles e encare o Ruivo. E lembre: no norte, como se ganha conta mais do que ganhar.'],
    done: ['O Ruivo veio aqui contar a história ele mesmo. Bebeu meu hidromel e não reclamou do gosto. Isso nunca aconteceu.'] },
  w10: {
    talk: ['Senta. Não, não perto do fogo. Perto da porta. Quero ver você indo embora depois, inteiro.', 'Estou velho, e a doença me come por dentro. Os curandeiros dizem um inverno. Eu digo que um guerreiro do Corvo não espera o inverno decidir.', 'Oito carniçais rondam a estrada da Fortaleza. Limpe o caminho. Depois venha. Tenho um último pedido, e você vai odiar.'],
    done: ['Seja o que for que você decidiu, decidiu de frente. O Clã viu. Odin também.', 'Guerreiro do Corvo. Leve o nome. A Brynhild cuida do pátio daqui em diante: ela vai ensinar o que os dois corvos dizem.'] },

  /* ---------- Capítulo II (Brynhild, o pátio é dela) ---------- */
  gc1: { giver: BY, turnin: BY, meet: {}, objs: [{ kind: 'visit', poi: 'Fortaleza de Odin' }],
    text: 'A Brynhild assumiu o pátio da Fortaleza de Odin. Ela chama você para a primeira lição dos dois corvos: Hugin é o pensamento, o lado da ordem; Munin é a memória, o lado do sangue.',
    talk: ['O velho não comanda mais o pátio. Não importa se está com as valquírias ou na cama dos curandeiros, resmungando: o Clã precisa de alguém que ensine, e sobrou eu.', 'Venha à Fortaleza. Lá no alto se ouve melhor o que os corvos dizem.'],
    done: ['Hugin pensa. Munin lembra. Quem só pensa vira o Fio: certo, frio, sem memória de quem pisou. Quem só lembra vira os Desfiados: quente, faminto, sem plano.', 'O guerreiro do Corvo fica no meio. Não por covardia. Porque o meio é o lugar mais difícil de segurar. As posturas de defesa e de cura vêm daqui. Mas primeiro, a forja precisa de ferro.'] },
  w04: { giver: BY,
    text: 'O inverno quebra lâminas, e o pátio novo da Brynhild começa sem espadas. A forja da Fortaleza precisa de minério de ferro: doze pedras boas. Sem roubar de ninguém.',
    talk: ['Doze pedras de ferro. O velho mandaria você roubar dos anões e pedir desculpa depois. Eu não. Cave.', 'Os anões de Brasaforja vendem para os dois lados pelo mesmo preço. Nós cavamos a nossa própria pedra. É o que nos deixa no meio.'],
    done: ['Doze. Boas. A forja acendeu de novo. O primeiro golpe do martelo foi em silêncio: é costume, pelos que não voltaram.'] },
  w06: { giver: BY,
    text: 'Um emissário da Ordem do Fio quer o Clã do Corvo guardando os corredores do Labirinto. Vá a Askavik e ouça o Paladino Aldric. E responda pelo Clã.',
    talk: ['O Fio mandou um emissário. O Aldric. Dizem que é sincero. Os sinceros são os mais difíceis de recusar.', 'Ouça. Responda pelo Clã. Mas lembre: Hugin num ombro, Munin no outro. Não deixe um corvo só falar.'] },
  w05: { giver: BY,
    text: 'Os túmulos do norte estão se abrindo e os mortos andam até as cercas. Os velhos culpam o Atoleiro do sul: Zerath apodrece até o que está congelado. Derrube doze mortos-vivos.',
    talk: ['Os sem-nome de Snæbú foram só o começo. Agora os túmulos dos nossos estão se abrindo também.', 'Os velhos dizem que é Zerath. Eu digo que morto que anda merece ser posto para dormir de novo, com respeito e com força. Doze.'],
    done: ['Doze deitados de novo. Enterrei um deles com o machado dele no peito. Era primo do Bragi. O skald vai cantar isso, e vai errar a rima de propósito.'] },
  w07: { giver: BY,
    text: 'Os lobisomens selvagens saíram do Covil e caçam nas estradas do norte. Seis. Não os da matilha da Mãe-Alfa: os quebrados, que ninguém foi buscar.',
    talk: ['Os da Mãe-Alfa têm lei. Esses do Covil não têm nada: a lua quebrou e ninguém foi buscar. Eles comem viajante.', 'A lâmina afiada e a cabeça fria. Lobisomem não morre fácil, e quem tem raiva deles morre primeiro.'],
    done: ['Seis. A Mãe-Alfa mandou um recado: “o Corvo fez o trabalho que era nosso”. Não sei se é agradecimento ou ofensa. Com lobo, é sempre os dois.'] },
  w09: { giver: BY,
    text: 'A tempestade trouxe tudo de uma vez: lobos gélidos e lobisomens descendo juntos para Fjallbrún. A vila só tem velhos e crianças. A Brynhild vai junto.',
    talk: ['Fjallbrún. A vila para onde o meu irmão fugiu. Os velhos de lá deram pão a ele. Agora a gente devolve.', 'Lobos gélidos e lobisomens, na mesma tempestade. Fique do meu lado esquerdo. É o lado em que eu não enxergo bem.'],
    done: ['A vila está de pé. Uma velha de Fjallbrún me perguntou se eu era a irmã do Halfdan. Eu disse que sim. Ela me deu um pão. Eu comi.'] },
  gc5: { turnin: JARL, objs: [{ kind: 'kill', type: 'ghoul', n: 8 }, { kind: 'talk', npc: JARL }],
    text: 'O Jarl Sigurd quer ouvir, no salão de Jarlsheim, o que o Fio e os Desfiados ofereceram ao Clã e o que você respondeu. Derrube os carniçais que rondam o caminho e vá ao salão.',
    talk: ['O Jarl quer ouvir de você, não de mim. Ele diz que eu falo pouco. Eu digo que ele escuta pouco. Estamos os dois certos.'],
    meet: { [JARL]: [{ who: JARL, t: 'O Fio pediu. Os Desfiados pediram. Você pesou, arbitrou, falou com os corvos. Agora fale comigo.' }, { who: JARL, t: 'Quando a guerra das bandeiras chegar ao norte, o Clã vai precisar de quem segure o meio. Não precisa ser você. Mas pode ser.' }] },
    done: ['O Clã do Corvo não escolhe. Pesa. E agora o norte inteiro sabe o seu peso.'] },
};
