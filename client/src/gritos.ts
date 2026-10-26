/* GRITOS DE BATALHA (26/10, Erling: "toda vez que vê um elite grande ou um semichefe, seja em masmorra, no mapa ou de missão, ele fala
   algo com sentido para a sua classe e raça — isso traz proximidade com o jogador"). Uma frase ao avistar; a mesma criatura não
   arranca outra por um bom tempo. O chefe tem a sua lista, mais pesada. */
import type { KitKey } from './kits';

type Sex = 'm' | 'f';
/** {o} = o/a conforme o sexo, {ho} = herói/heroína… só nas frases que precisam */
const G = (s: string, sex: Sex) => s.replace(/\{o\}/g, sex === 'f' ? 'a' : 'o').replace(/\{dor\}/g, sex === 'f' ? 'dora' : 'dor');

const ELITE: Record<KitKey, string[]> = {
  human: [
    'Que monstruosidade é essa? Eu vou sobreviver a você!',
    'Não nasci herói. Mas também não nasci para correr.',
    'Karmika vai saber que eu estive aqui. Vem!',
    'Grande, feio e lento. Dois de três eu resolvo com a espada.',
    'Minha mãe dizia: olhe o medo nos olhos. Pronto. Olhei.',
    'O Olho está vendo. Então vamos fazer valer a pena.',
    'Se eu cair, que seja de pé.',
  ],
  nordic: [
    'Odin! Mande os corvos: hoje tem carne no chão!',
    'Pelo martelo de Thor, essa coisa vai aprender a sangrar!',
    'Valhalla espera. Mas hoje ainda não, bicho!',
    'Fenrir mandou você? Diga a ele que estou aqui!',
    'Mais um nome para a minha saga. Vem, montanha de carne!',
    'Meu escudo já comeu coisa pior no café da manhã!',
    'O Norte não recua. Avante!',
  ],
  dwarf: [
    'Pelas barbas do Grande Mestre Cascudo! Que aberração é essa? Parece a minha sogra!',
    'Pela Forja! Esse bicho vai virar bigorna!',
    'Mais feio que anão sem barba. E olha que isso é feio.',
    'Chega perto, grandão. Minha machadinha quer conversar.',
    'Rocha não corre. E eu sou feito de rocha!',
    'Isso aí tem cheiro de minério ruim. Vou refinar na marra.',
    'Não cabe na minha caverna, mas cabe no meu machado!',
  ],
  elf: [
    'Que os Antigos me perdoem por tirar uma vida. Mas este monstro precisa partir.',
    'A mata chora quando você passa. Hoje ela vai sorrir.',
    'Há mil anos os meus esperam por isto. Não vou errar.',
    'Volte ao silêncio de onde veio.',
    'Meu arco conhece o seu coração melhor que você.',
    'Nem toda sombra merece a noite. A sua não.',
    'Pelas folhas de Aelvaren: hoje, não.',
  ],
  technocrat: [
    'Vamos ver se esse reator funciona mesmo agora! Morre, ser maldito!',
    'Dados insuficientes. Vou coletar na prática.',
    'Isso é biologia primitiva. Eu sou o futuro.',
    'Sobrecarga autorizada. Que a Academia me perdoe a conta de energia.',
    'Você não entende o que é um ampère. Vai entender.',
    'Calma, calma… ajustando a mira… agora!',
    'Protocolo de extermínio: iniciado.',
  ],
  tecno: [
    'Vamos ver se esse reator funciona mesmo agora! Morre, ser maldito!',
    'Dados insuficientes. Vou coletar na prática.',
    'Sobrecarga autorizada. Que a Academia me perdoe a conta de energia.',
    'Você não entende o que é um ampère. Vai entender.',
    'Calma, calma… ajustando a mira… agora!',
    'Protocolo de extermínio: iniciado.',
    'A ciência não tem medo. Eu tenho um pouco. Mas a ciência manda.',
  ],
  pal: [
    'Que Auréon me proteja nesta batalha. Avante!',
    'A luz não negocia com a sombra. Nem eu.',
    'Ajoelhe, criatura, e talvez eu reze por você.',
    'Fui ordenad{o} para isto. Venha!',
    'Cada golpe meu é uma oração. Prepare-se para ouvir muitas.',
    'Em nome dos que você devorou: chega.',
    'A fé não tira a dor. Mas segura o escudo.',
  ],
  cac: [
    'Ahn… essa cabeça vai ficar ótima em cima da minha lareira!',
    'Mais um nome na lista. Riscado em breve.',
    'A Escola me ensinou a caçar coisas assim. Hoje é a prova final.',
    'Corre, se quiser. Eu caço melhor quando a presa corre.',
    'Demônio, besta ou aberração: morre tudo igual.',
    'Já vi coisa pior. Mentira. Mas vou matar mesmo assim.',
    'A besta está pronta. A sua cabeça também?',
  ],
  vam: [
    'Que desperdício de sangue. Vou aproveitar.',
    'Grite. A noite gosta de música.',
    'Séculos me ensinaram paciência. Você vai me ensinar nada.',
    'A Corte vai gostar desta história. Você não vai estar nela.',
    'Eu já morri uma vez. Sua vez.',
    'Tanta carne, tão pouco espírito. Deixe-me corrigir isso.',
    'Venha para a sombra. Eu moro aqui.',
  ],
  lob: [
    'A matilha ouviu você de longe. Agora vai sentir.',
    'Sinto o seu medo. Está delicioso.',
    'Eu sou a fera que você teme no escuro. Olhe para mim.',
    'A lua ainda não subiu e eu já quero sangue.',
    'Presa grande. Boa. Estava com fome.',
    'Uive comigo, monstro. Depois cale-se para sempre.',
    'Ninguém caça na minha floresta. Ninguém.',
  ],
  mag: [
    'A Biblioteca tem um capítulo sobre você. Curto.',
    'Fogo, gelo ou raio? Vou deixar você escolher… não, vou escolher eu.',
    'Dizem que magia é perigosa. Para você, é.',
    'Que os Antigos guiem a minha mão. E que ela não trema.',
    'Você é matéria. Eu sou vontade.',
    'Um feitiço bem lançado vale mil espadas. Vou lançar dois.',
    'O conhecimento vence a força. Sempre. Vamos provar.',
  ],
  bru: [
    'O pacto quer o seu coração. Eu vou entregar.',
    'Venha, bicho. O caldeirão precisa de um ingrediente grande.',
    'Minhas marcas ardem quando algo assim se aproxima. Que bom.',
    'Eu não rezo. Eu cobro.',
    'A sombra sussurra o seu nome. Diz que é hoje.',
    'Pacto, pacto, cumpra-se: traga-me esta carne.',
    'Você é feio. Eu sou pior. Vamos ver quem sangra.',
  ],
};
const BOSS: Record<KitKey, string[]> = {
  human: ['Então é você. Pensei que seria maior. Pensei errado. Tanto faz!', 'Se o Olho quer uma história, eu vou escrever uma.', 'Não vou implorar. Vem!'],
  nordic: ['ODIN! Olhe para mim agora!', 'Esta é a batalha que os bardos vão cantar. Que cantem alto!', 'Meu sangue pelo Norte. O seu pela minha lâmina!'],
  dwarf: ['Pela Forja, pela Pedra e pela barba do meu pai: HOJE!', 'É grande. Eu já vi montanha maior. E furei.', 'Sogra, não. Isso aí é pior!'],
  elf: ['Os Antigos sussurram o seu fim. Eu sou a voz.', 'Mil anos de paciência. Acabaram.', 'Que a mata guarde este dia.'],
  technocrat: ['Reator em cem por cento. Que comece o experimento.', 'Você é a variável. Eu sou o resultado.', 'Academia, registrem: hoje a ciência matou um deus.'],
  tecno: ['Reator em cem por cento. Que comece o experimento.', 'Você é a variável. Eu sou o resultado.', 'Academia, registrem: hoje a ciência matou um deus.'],
  pal: ['AURÉON! Vê o teu servo e guia a minha lâmina!', 'A luz não se apaga. A sombra, sim. Agora.', 'Pelos inocentes. Pelos caídos. Por todos.'],
  cac: ['A caçada de uma vida. Finalmente.', 'A lareira vai precisar de uma parede maior.', 'Sem truques. Sem fuga. Só nós dois.'],
  vam: ['Que criatura magnífica. Vou beber tudo.', 'A eternidade me trouxe até aqui. Que seja digno.', 'Ajoelhe. É o que os mortais fazem diante de mim.'],
  lob: ['A LUA! Ela sobe por mim! AUUUUU!', 'Toda a matilha em mim. Venha!', 'Você vai ser a história que os filhotes temem.'],
  mag: ['Este é o feitiço que eu nunca ousei. Hoje ouso.', 'O orbe está quente. As palavras, prontas. Comece.', 'Matéria, dobre-se. Vontade, vença.'],
  bru: ['O pacto inteiro, de uma vez. Que custe o que custar.', 'As marcas queimam até o osso. É o sinal. É você.', 'Sombra, me cobra depois. Agora me dá força.'],
};

const seen = new Map<string, number>(); let lastAny = 0;
/** uma frase ao avistar; null se não é hora (mesma criatura há pouco, ou falou há menos de 20 s) */
export function battleCry(kit: KitKey, sex: Sex, key: string, boss: boolean): string | null {
  const now = performance.now(); if (now - lastAny < 20000) return null; const last = seen.get(key) ?? -1e9; if (now - last < 240000) return null;
  seen.set(key, now); lastAny = now;
  const L = (boss ? BOSS : ELITE)[kit] ?? ELITE.human; return G(L[Math.floor(Math.random() * L.length)], sex);
}
