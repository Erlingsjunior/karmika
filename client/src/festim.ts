/* ---------- A mesa dos anões (Erling, 27/10/2026) ----------
   As carroças dos anões não vendem o mesmo que as de latão: vendem carne na brasa, cerveja e vinho. Cada prato e cada caneca
   dura 15 minutos e dá um pouco de vida máxima, vigor, força ou outra benesse. Um prato e uma bebida por vez (o novo troca o velho).
   Tudo pequeno de propósito: entra no balde da regra 01 (dano) e nunca vira força absurda.
   E dá para CONTRATAR os anões para uma festa na sua cidade-lar ou no salão da guilda: lugar, tempo, música, carnes e bebidas. */
export interface Feast { name: string; icon: string; slot: 'meal' | 'brew'; desc: string; price: number;
  /** frações: hp = vida máxima, stam = vigor máximo, dmg = dano, crit = crítico, move = velocidade, def = defesa; regen = vida por segundo */
  hp?: number; stam?: number; dmg?: number; crit?: number; move?: number; def?: number; regen?: number }
export const FEAST_MIN = 15;
export const FEASTS: Record<string, Feast> = {
  costela: { name: 'Costela na Brasa', icon: '🍖', slot: 'meal', price: 34, hp: 0.1, stam: 0.15, regen: 0.4,
    desc: 'Doze horas no fogo de chão, do jeito que o avô do Durin fazia em Brasaforja. Dizem que um anão já trocou o machado por uma peça inteira e não se arrependeu.' },
  chuleta: { name: 'Chuleta Carnuda', icon: '🥩', slot: 'meal', price: 30, hp: 0.06, dmg: 0.04,
    desc: 'Grossa como um escudo e servida com o osso para você roer no caminho. O ferreiro jura que bate mais forte depois de uma.' },
  contrafile: { name: 'Contra-filé Macio', icon: '🍽', slot: 'meal', price: 32, hp: 0.08, stam: 0.1, regen: 0.25,
    desc: 'Corta com a colher. A cozinheira da carroça chama de “carne de domingo” e cobra como se todo dia fosse domingo.' },
  picanha: { name: 'Picanha no Alho', icon: '🧄', slot: 'meal', price: 38, hp: 0.12, dmg: 0.03,
    desc: 'Capa de gordura dourada e alho até a alma. Vampiro nenhum chega perto da carroça quando ela está na grelha — e quem é vampiro, cuidado.' },
  ancho: { name: 'Ancho com Chimichurri', icon: '🌿', slot: 'meal', price: 36, stam: 0.12, dmg: 0.05,
    desc: 'O molho verde veio do sul numa troca que ninguém lembra direito. A receita, os anões não passam nem bêbados.' },
  cerveja_forte: { name: 'Cerveja Forte', icon: '🍺', slot: 'brew', price: 14, dmg: 0.06, def: -0.03,
    desc: 'Fermentada em barril de carvalho queimado. Dá coragem e tira um pouco do juízo: você bate mais e se cuida menos.' },
  cerveja_amanteigada: { name: 'Cerveja Amanteigada', icon: '🧈', slot: 'brew', price: 16, stam: 0.12, regen: 0.3,
    desc: 'Doce, cremosa, servida morna nas noites de neve. As crianças anãs ganham uma versão sem álcool e reclamam o ano inteiro.' },
  cerveja_preta: { name: 'Cerveja Preta', icon: '🍻', slot: 'brew', price: 15, dmg: 0.04, def: 0.04,
    desc: 'Escura como a mina e tostada no forno da forja. Quem bebe fica firme no chão, igual a um anão em dia de feira.' },
  ipa: { name: 'IPA dos Mineiros', icon: '🍺', slot: 'brew', price: 17, crit: 0.04, dmg: 0.03,
    desc: 'Lúpulo demais para os velhos, o jeito certo para os novos. Amarga, aguça o olho e acerta onde dói.' },
  cerveja_leve: { name: 'Cerveja Leve', icon: '🍺', slot: 'brew', price: 10, move: 0.06,
    desc: 'A cerveja do almoço: clara, fresca, não pesa. Os carroceiros bebem uma antes de pegar a estrada.' },
  vinho_forja: { name: 'Vinho da Forja', icon: '🍷', slot: 'brew', price: 22, hp: 0.06, regen: 0.35,
    desc: 'Tinto encorpado envelhecido ao lado das fornalhas. Esquenta por dentro e fecha os cortes devagar.' },
  vinho_rubro: { name: 'Vinho Rubro de Brasaforja', icon: '🍷', slot: 'brew', price: 26, crit: 0.03, def: 0.03,
    desc: 'O vinho dos brindes de clã. Só se abre quando alguém volta vivo de uma luta que não devia ter vencido.' },
};
export const feastEff = (f: Feast) => [f.hp ? `+${Math.round(f.hp * 100)}% vida máxima` : '', f.stam ? `+${Math.round(f.stam * 100)}% vigor` : '', f.dmg ? `${f.dmg > 0 ? '+' : ''}${Math.round(f.dmg * 100)}% de dano` : '', f.crit ? `+${Math.round(f.crit * 100)}% de crítico` : '', f.def ? `${f.def > 0 ? '+' : ''}${Math.round(f.def * 100)}% de defesa` : '', f.move ? `+${Math.round(f.move * 100)}% de velocidade` : '', f.regen ? `+${f.regen} de vida por segundo` : ''].filter(Boolean).join(', ');

/** a festa contratada: preço */
export interface FestaPlan { where: string; min: number; music: boolean; meats: string[]; brews: string[] }
export const festaPrice = (p: FestaPlan) => 250 + p.min * 40 + (p.music ? 180 : 0) + p.meats.reduce((a, k) => a + FEASTS[k].price * 6, 0) + p.brews.reduce((a, k) => a + FEASTS[k].price * 8, 0);

/* ---------- O que cada carroça vende (Erling, 27/10) ----------
   LATÃO (tecnocratas): serviços e engenhocas que duram TURNOS (1 turno = meia hora real), reações químicas, carvão
   potencializado (a fornalha quente que certas armas pedem) e pets robóticos.
   ANÕES: além da mesa, as peças finas que os tecnocratas usam para montar robôs, torres e ferramentas. */
export const TURN_MIN = 30;
export interface Gadget { name: string; icon: string; price: number; desc: string; kind: 'misc' | 'res'; col: number }
export const GADGETS: Record<string, Gadget> = {
  ajudante_obra: { name: 'Ajudante de Obra', icon: '🦾', price: 220, kind: 'misc', col: 0xd0a040, desc: 'Um robô pedreiro da Companhia. Use de qualquer lugar: ele vai sozinho até o canteiro da sua obra inteira e trabalha turno após turno, mesmo com você longe. Até 4 ao mesmo tempo — cada um soma, e a obra anda mais rápido. E perto dele: desmonta e guarda (o tempo que sobrou fica). Mas é indefeso: se um bicho chegar e nenhuma Sentinela estiver cobrindo a obra, ele vira sucata. Plante torres em volta.' },
  obra_auto: { name: 'Contrato de Obra Automatizada', icon: '📜', price: 400, kind: 'misc', col: 0xd0a040, desc: 'A licença da Companhia de Latão para pôr robôs numa obra. Sem ela, nenhum Ajudante de Obra pisa no seu canteiro. Um contrato por casa: ele se vincula à obra que você tem (ou à primeira que começar, se comprar antes) e some quando a casa fica pronta.' },
  sentinela: { name: 'Robô Sentinela de Latão', icon: '🤖', price: 260, kind: 'misc', col: 0xb08a40, desc: 'Plante onde quiser defender: ele fica ali por 1 turno, gira a cabeça e solta descargas em quem se aproxima (12 m). Um por vez. Os engenheiros juram que ele não tem nome; todos chamam de Bartolomeu.' },
  drone_cura: { name: 'Drone de Cura Automatizada', icon: '🛸', price: 160, kind: 'misc', col: 0x7affd0, desc: 'Paira sobre o seu ombro por 1 turno e borrifa vapor medicinal: +2% de vida a cada 6 s. Faz um barulhinho de chaleira quando trabalha.' },
  drone_choque: { name: 'Bobina de Choque Automatizado', icon: '⚡', price: 170, kind: 'misc', col: 0x6ad0ff, desc: 'Presa ao cinto por 1 turno: a cada 4 s, um raio pula no inimigo mais perto (7 m). Não chegue perto de poça de água com isso ligado. Sério.' },
  escudo_auto: { name: 'Escudo Automatizado', icon: '🛡', price: 200, kind: 'misc', col: 0x9aa4b4, desc: 'Um disco de latão gira à sua volta por 1 turno e, a cada 25 s, arma uma barreira que segura um golpe inteiro. Ele faz “clanc” e você nem sente.' },
  carvao_azul: { name: 'Carvão Azul', icon: '🔷', price: 45, kind: 'res', col: 0x4a8aff, desc: 'Carvão anão que passou pelo laboratório da Companhia e voltou queimando azul. A fornalha passa do ponto do ferro: a peça forjada nesse fogo sai no mínimo rara (amarela). Os anões têm as peças, os tecnocratas têm o fogo.' },
  carvao_amarelo: { name: 'Carvão Amarelo', icon: '🔶', price: 160, kind: 'res', col: 0xffc030, desc: 'Tratado três vezes no vapor da Companhia. Queima amarelo e chia: só ele esquenta a fornalha para peças de classe superior (no mínimo lendárias).' },
  carvao_vermelho: { name: 'Carvão Vermelho', icon: '♦', price: 600, kind: 'res', col: 0xff2a1a, desc: 'O segredo mais bem guardado da Companhia: queima vermelho como o coração de um vulcão. É o único fogo que forja peças únicas e poderosas. Cada pedra tem número de série.' },
  carvao_pot: { name: 'Carvão Potencializado (antigo)', icon: '🪨', price: 45, kind: 'res', col: 0x3a3030, desc: 'O lote antigo da Companhia, antes da classificação por cor. Vale o mesmo que o Carvão Azul na troca com os mercadores.' },
  reacao_azul: { name: 'Reação Química Azul', icon: '🧪', price: 25, kind: 'misc', col: 0x4a8aff, desc: 'Reação leve. Use e ela estoura à sua frente num clarão azul: dano pequeno em volta (2,5 m). Boa para festas de aniversário de engenheiro.' },
  reacao_amarela: { name: 'Reação Química Amarela', icon: '🧪', price: 60, kind: 'misc', col: 0xffd040, desc: 'Reação intensa. Explosão amarela de 4 m que derruba e atordoa. O rótulo diz “não agite”. Ninguém lê.' },
  reacao_vermelha: { name: 'Reação Química Vermelha', icon: '🌋', price: 140, kind: 'misc', col: 0xff3a1a, desc: 'O que você quer, criar um vulcão em casa? Ok, nós te ajudamos. Abre um vulcão de bolso: erupção de 6 m, lava no chão por alguns segundos e um susto que a vila vai lembrar.' },
  porca_perfeita: { name: 'A Porca Perfeita', icon: '🔩', price: 30, kind: 'res', col: 0xc8c8d0, desc: 'Forjada em Brasaforja e medida com o fio de cabelo da barba do mestre. Não afrouxa nem em terremoto. Os tecnocratas montam robôs e torres com ela.' },
  parafuso_inexp: { name: 'O Parafuso Inespanável', icon: '🔧', price: 32, kind: 'res', col: 0xb8b8c8, desc: 'A rosca é tão justa que a chave cansa antes dele. Diz a lenda que um anão foi enterrado com um, para o caixão nunca abrir.' },
  engrenagem_diam: { name: 'A Engrenagem Diamantada', icon: '⚙', price: 70, kind: 'res', col: 0xd8e8ff, desc: 'Dentes com pó de diamante: nunca gasta. A Companhia de Latão compra todas que os anões fazem, e os anões cobram cada vez mais.' },
};

/* ---------- Níveis das engenhocas de turno (Erling, 27/10): Mk I · Mk II · Mk III ----------
   Mk I dura 1 turno (30 min), é a mais barata e a mais fraca; Mk II dura 2 turnos (1 hora); Mk III dura 4 turnos (2 horas) e é a mais forte e cara.
   O id do Mk I é o de sempre (ex.: 'sentinela'); os outros levam _2 e _3. */
export const TIMED = ['sentinela', 'drone_cura', 'drone_choque', 'escudo_auto', 'ajudante_obra'] as const; /* 28/10: o Contrato de Obra deixou de ter níveis — é uma licença só */
export const MK = ['I', 'II', 'III'];
/** turnos de cada nível: 30 min, 1 hora, 2 horas */
export const TURNS = [1, 2, 4];
export const PRICE_K = [1, 2.3, 4];
/** o poder de cada nível (índice 0..2) */
export const TIER: Record<string, { what: (t: number) => string }> = {
  sentinela: { what: (t) => `descarga a cada ${[1.2, 1, 0.8][t]} s em quem chega a ${[12, 14, 16][t]} m, ${['fraca', 'média', 'forte'][t]}` },
  drone_cura: { what: (t) => `+${[2, 3, 4][t]}% de vida a cada 6 s` },
  drone_choque: { what: (t) => `raio a cada ${[4, 3.5, 3][t]} s no inimigo mais perto (${[7, 8, 9][t]} m), ${['fraco', 'médio', 'forte'][t]}` },
  escudo_auto: { what: (t) => `segura um golpe inteiro a cada ${[25, 20, 15][t]} s` },
  ajudante_obra: { what: (t) => `trabalha ${[1, 2, 4][t]} turno${t ? 's' : ''} na obra sozinho` },
};
export const tierOf = (id: string) => { const m = /_(2|3)$/.exec(id); return m ? +m[1] - 1 : 0; };
export const baseOf = (id: string) => id.replace(/_(2|3)$/, '');
for (const b of TIMED) { const g0 = GADGETS[b]; for (let t = 0; t < 3; t++) { const id = t ? `${b}_${t + 1}` : b, turns = TURNS[t];
  GADGETS[id] = { ...g0, name: `${g0.name} Mk ${MK[t]}`, price: Math.round(g0.price * PRICE_K[t]), desc: `${g0.desc.replace(/ por 1 turno| \(1 turno\)|, por 1 turno|por 1 turno/g, '')}\nMk ${MK[t]}: dura ${turns} turno${turns > 1 ? 's' : ''} (${turns === 1 ? '30 min' : turns / 2 + (turns === 2 ? ' hora' : ' horas')}) · ${TIER[b].what(t)}.` }; } }
