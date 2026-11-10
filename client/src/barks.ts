/* Falas soltas dos NPCs (Erling, 25/10: "eles podem falar mais, e falar coisas diferentes dependendo das situações, mas não vamos exagerar").
   De vez em quando (uma fala a cada 8–16 s na região, nunca duas ao mesmo tempo) um NPC por perto comenta o que está acontecendo:
   a hora, o frio, a Lua de Sangue, a sua briga, o seu sangue no chão, o seu karma, o seu caminho, o seu pet, o ofício dele.
   {nome} = o herói · {pet} = o nome do pet. A situação mais específica ganha da genérica. */
export const BARKS: Record<string, string[]> = {
  /* hora do dia */
  manha: ['O galo cantou duas vezes. Vai chover ou vai dar morte.', 'Pão quente na praça, quem chegar primeiro.', 'Dormiu bem, {nome}? Eu não. Os cães uivaram a noite inteira.', 'Manhã fria assim, só com caldo.', 'Já abriram o portão? Os lenhadores querem sair cedo.'],
  dia: ['Sol alto. Bom para secar couro e ruim para quem trabalha na forja.', 'Se for para a mata, volte antes do anoitecer.', 'O mercado está cheio hoje. Alguém viu o Thorin?', 'Dizem que em Askavik as ruas são de pedra até nos becos.', 'Quem perdeu um balde no poço? De novo?'],
  noite: ['Fecha a janela, já é noite.', 'De noite, nem o cachorro sai sozinho.', 'Ouviu isso? Não… deve ter sido o vento.', 'Acende a lamparina, que a escuridão aqui tem dono.', 'Volta cedo amanhã, {nome}. A noite cobra de quem anda nela.', 'As corujas estão quietas. Isso nunca é bom.'],
  frio: ['Esse frio entra nos ossos e mora lá.', 'Tem lenha na sua casa? Na minha não tem.', 'Vai neve antes do fim da semana, aposto meu gorro.', 'Esfrega as mãos, {nome}, senão a espada cai.'],
  calor: ['Que calor. A cerveja esquenta antes de chegar na boca.', 'Até as moscas estão cansadas hoje.', 'Na sombra do templo dá para respirar.'],
  /* eventos mundiais */
  lua: ['A lua está sangrando… Fecha tudo, pelo amor do Olho.', 'Noite de Lua de Sangue: as crias do Conde saem para caçar.', 'Meu avô dizia: quando a lua fica vermelha, o lobo lembra que já foi homem.', 'Não olha muito para ela, {nome}. Dizem que ela olha de volta.', 'Hoje até os mortos do cemitério estão inquietos.'],
  aurora: ['Dia da Aurora! Sente o cheiro? É Auréon passando.', 'Os paladinos estão cantando desde cedo. Dá vontade de acreditar.', 'Hoje qualquer bondade vale em dobro. Aproveita, {nome}.', 'Viu os brilhos caindo? Minha filha quer guardar um num pote.'],
  /* o que o herói está passando */
  combate: ['Cuidado! Atrás de você!', 'Bate nele, {nome}! Bate!', 'Alguém chama a guarda!', 'Pelo Olho, não deixa ele chegar nas casas!', 'Isso! Mais um desses e a vila dorme em paz.'],
  ferido: ['Você está sangrando, {nome}. Senta um pouco.', 'A curandeira tem unguento. Vai antes que caia.', 'Com essa cara, até eu ganhava de você. Come alguma coisa!', 'Não morre na minha porta, por favor.'],
  montado: ['Bonito cavalo. Cuida dele, que cavalo bom não nasce em árvore.', 'Devagar com esse bicho na praça, tem criança!', 'Quanto custou essa montaria? Não, não fala. Vou chorar.'],
  pet: ['Que {pet} mais bonito! Posso fazer carinho?', 'Esse {pet} já roubou um pão da minha mesa.', 'Cuida bem do {pet}, que bicho fiel vale mais que ouro.', 'Ô {pet}! Vem cá, vem!'],
  novato: ['Você é o novo? Tem cara de quem acordou ontem.', 'Primeira vez em Karmika? Não come cogumelo azul.', 'Vai com calma, {nome}. Rato também morde.'],
  veterano: ['Dizem que você já derrubou coisa grande, {nome}.', 'Olha só quem voltou. A vila fica mais segura com você aqui.', 'Meu filho quer ser igual a você. Eu disse que ele precisa comer verdura primeiro.'],
  /* a alma do herói */
  luz: ['A vila fala bem de você, {nome}.', 'Gente boa ainda existe. Que o Olho te guarde, {nome}.', 'As crianças dizem que você é herói. Não deixa subir à cabeça.'],
  sombra: ['…não fala comigo. Ouvi o que você fez.', 'Esconde a bolsa, Marta, olha quem vem aí.', 'Seu olhar mudou, {nome}. Os cães sentem.', 'Na sua sombra tem mais coisa do que você.'],
  /* o caminho */
  vam: ['Que pele pálida… você está doente?', 'Ele não comeu nada na taverna. De novo.', 'Alho na porta, Marta. Agora.'],
  lob: ['Cheiro de cachorro molhado… é você?', 'Seus olhos brilharam? Não, deve ter sido a lanterna.', 'Os cães da vila ficam quietos quando você passa. Estranho.'],
  mag: ['Mago na vila! Será que ele conserta o poço com magia?', 'Não encosta nas minhas galinhas com esse cajado.'],
  bru: ['Benze-te, menina. É o bruxo.', 'Dizem que bruxo paga o preço com a própria sombra.', 'Não aceito moeda sua. Vai que está amaldiçoada.'],
  pal: ['Paladino de Auréon! Abençoa meu filho?', 'Com você aqui eu durmo de janela aberta.', 'A armadura brilha mesmo à noite, olha só.'],
  cac: ['Caçador do Bastião… quem morreu?', 'Se você está aqui, tem demônio por perto.', 'Prata no cinto. Então é verdade o que dizem.'],
  tecno: ['Que barulho é esse no seu peito? Um coração de lata?', 'A Academia mandou mais um. Cuidado com o reator perto do feno.', 'Meu avô dizia que máquina não tem alma. Você tem?'],
  gue: ['Um guerreiro do Norte! Odin ainda manda os seus.', 'Calma com o machado, a vila é pequena.', 'Cicatrizes bonitas. Quantos inimigos foram?'],
  /* o alinhamento kármico com o lugar (25/10) */
  rep_alta: ['Olha quem está aqui! Senta, {nome}, a casa é sua.', 'Minha mãe reza por você toda noite. Sério.', 'Se precisar de qualquer coisa, é só pedir. Qualquer coisa.', 'As crianças brincam de ser você, sabia?', 'Guardei o melhor pedaço do pão para você.'],
  rep_baixa: ['Não queremos encrenca aqui.', 'Os guardas estão de olho em você.', 'Some daqui antes que eu chame alguém.', 'Lojista nenhum vai te fazer preço bom aqui.'],
  despedida: ['Então é verdade? Você vai embora de Karmika?', 'A vila vai ficar mais quieta sem você, {nome}.', 'Leva um pedaço de queijo para a estrada. Leva!', 'Vou sentir sua falta. Não conta para ninguém que eu disse isso.', 'Volta de vez em quando, ouviu? Promete.', 'O Garrick finge que não, mas ele está orgulhoso.'],
  festa: ['À saúde de {nome}!', 'Mais cerveja aqui! O anão trouxe barril para a vila inteira!', 'Olha os fogos! Olha os fogos!', 'Essa carne está divina, quem assou?', 'Que o caminho seja leve, {nome}!', 'Alguém segura o Bento antes que ele cante de novo.', 'Dança, {nome}! Hoje a festa é sua!'],
  volta: ['Você voltou! A festa ainda é assunto na taverna.', 'Olha só, o herói de Karmika em casa de novo!', 'Conta, conta: como é o mundo lá fora?', 'Seu lugar na mesa continua guardado.', 'A Lúcia vai ficar feliz de te ver. O Bento também.'],
  /* o ofício de quem fala */
  r_guarda: ['Fique dentro dos muros depois do sol, {nome}.', 'Viu alguém estranho na estrada? Me avisa.', 'Eu guardo este portão desde antes de você saber andar.'],
  r_ferreiro: ['A forja não espera. Ferro frio não perdoa.', 'Traga minério, que eu faço milagre.', 'Essa sua lâmina precisa de fio, viu?'],
  r_taverna: ['Ensopado do dia: tem o que tinha ontem.', 'Cerveja de Karmika, a melhor do vale. A única, mas a melhor.', 'Senta, {nome}, que a mesa do canto está livre.'],
  r_mercador: ['Preço bom, só hoje. Amanhã também.', 'Compro tudo que brilha e metade do que não brilha.', 'Ouro na mão, mercadoria na outra. Simples.'],
  r_fe: ['O Olho de Marghar vê o que você faz, {nome}. Tudo.', 'Reze antes de dormir. Quem não reza, sonha.', 'Toda alma volta. Cuide do que vai levar.'],
};
/** o papel do NPC vira uma etiqueta de ofício */
export function roleTag(role: string) { const r = role.toLowerCase();
  if (/guarda|sargento|patrulha|sentinela/.test(r)) return 'r_guarda'; if (/ferreir|armeir|forja/.test(r)) return 'r_ferreiro';
  if (/cozinh|taverna|estalaj|cervej|churrasq/.test(r)) return 'r_taverna'; if (/mercad|comerci|vended|loj|domador|joalh/.test(r)) return 'r_mercador';
  if (/sacerd|templo|frei|irmã|abad|monge|vidente/.test(r)) return 'r_fe'; return ''; }

/* 10/11 (Erling: "os NPCs precisam conversar e falar bem ou mal da gente"): fofoca. De vez em quando dois moradores parados perto um do outro
   conversam sobre o herói enquanto ele passa (a 4–20 m): um puxa o assunto, o outro responde. O tom segue o karma (luz, neutro, sombra)
   e, quando há, o último feito que correu a vila (FAMA): matou um chefe, defendeu a vila, matou um inocente. */
export const FAMA: { deeds: { txt: string; good: boolean; at: number }[]; push(txt: string, good: boolean): void } = {
  deeds: [], push(txt, good) { this.deeds.push({ txt, good, at: performance.now() }); if (this.deeds.length > 8) this.deeds.shift(); },
};
export const GOSSIP: Record<'luz' | 'neutro' | 'sombra', [string, string][]> = {
  luz: [
    ['Viu quem passou? É o {nome}.', 'Gente boa. Ajudou a viúva do moinho sem pedir nada.'],
    ['Dizem que o {nome} nunca deixa ninguém para trás.', 'O Olho deve gostar dele. A sorte anda junto.'],
    ['Ontem o {nome} pagou a cerveja da mesa inteira.', 'E nem contou vantagem. Isso é raro.'],
    ['Se todo mundo fosse como o {nome}…', '…a guarda ia ter que procurar outro emprego.'],
    ['Minha filha quer ser igual ao {nome}.', 'Pior exemplo ela podia ter.'],
  ],
  neutro: [
    ['Quem é aquele ali?', 'O {nome}. Ninguém sabe direito de onde veio.'],
    ['O {nome} anda armado até para comprar pão.', 'Nesses tempos, eu também andaria.'],
    ['Acha que o {nome} fica muito tempo por aqui?', 'Gente assim nunca fica. A estrada chama.'],
    ['Dizem que o {nome} já morreu uma vez.', 'Todo mundo já morreu uma vez. O Olho que diga.'],
  ],
  sombra: [
    ['Não olha agora… é o {nome}.', 'Esconde a bolsa. E as galinhas.'],
    ['Ouvi coisa feia sobre o {nome}.', 'Eu também. E acredito em metade, o que já é muito.'],
    ['Por que a guarda não prende o {nome}?', 'Porque ninguém quer ser o primeiro a tentar.'],
    ['O {nome} cumprimentou meu marido hoje.', 'Reza por ele, então.'],
    ['Viu a sombra do {nome}? Anda atrasada.', 'Shh. Ele pode ouvir.'],
  ],
};
export const GOSSIP_DEED: { good: [string, string][]; bad: [string, string][] } = {
  good: [['Sabia? O {nome} {feito}.', 'Ouvi na taverna. Paguei uma rodada em homenagem.'], ['Falam que o {nome} {feito}.', 'Já não era sem tempo alguém fazer isso.'], ['O {nome} {feito}, acredita?', 'Acredito. Vi com estes olhos.']],
  bad: [['Ficou sabendo? O {nome} {feito}.', 'Que o Olho tenha piedade dele. Eu não tenho.'], ['Dizem que o {nome} {feito}.', 'Fecha a porta hoje à noite, viu?']],
};
export const GUARD_CRY = ['Pela vila!', 'Guardas, comigo!', 'Ninguém passa!', 'Fecha a fila, fecha a fila!', 'Volta pra mata, bicho!', 'Protejam as casas!'];
