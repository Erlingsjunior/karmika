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
  obra_auto: { name: 'Contrato de Obra Automatizada', icon: '🏗', price: 180, kind: 'misc', col: 0xd0a040, desc: 'Uma equipe de braços mecânicos da Companhia trabalha com você por 1 turno: cada peça de obra (B) gasta metade dos materiais. Os braços não falam, mas assobiam vapor quando acertam um prego.' },
  sentinela: { name: 'Robô Sentinela de Latão', icon: '🤖', price: 260, kind: 'misc', col: 0xb08a40, desc: 'Plante onde quiser defender: ele fica ali por 1 turno, gira a cabeça e solta descargas em quem se aproxima (12 m). Um por vez. Os engenheiros juram que ele não tem nome; todos chamam de Bartolomeu.' },
  drone_cura: { name: 'Drone de Cura Automatizada', icon: '🛸', price: 160, kind: 'misc', col: 0x7affd0, desc: 'Paira sobre o seu ombro por 1 turno e borrifa vapor medicinal: +2% de vida a cada 6 s. Faz um barulhinho de chaleira quando trabalha.' },
  drone_choque: { name: 'Bobina de Choque Automatizado', icon: '⚡', price: 170, kind: 'misc', col: 0x6ad0ff, desc: 'Presa ao cinto por 1 turno: a cada 4 s, um raio pula no inimigo mais perto (7 m). Não chegue perto de poça de água com isso ligado. Sério.' },
  escudo_auto: { name: 'Escudo Automatizado', icon: '🛡', price: 200, kind: 'misc', col: 0x9aa4b4, desc: 'Um disco de latão gira à sua volta por 1 turno e, a cada 25 s, arma uma barreira que segura um golpe inteiro. Ele faz “clanc” e você nem sente.' },
  carvao_pot: { name: 'Carvão Potencializado', icon: '🪨', price: 45, kind: 'res', col: 0x3a3030, desc: 'Carvão anão tratado no laboratório da Companhia: queima branco e esquenta a fornalha além do que o ferro aguenta. Certas armas só nascem nesse fogo.' },
  reacao_azul: { name: 'Reação Química Azul', icon: '🧪', price: 25, kind: 'misc', col: 0x4a8aff, desc: 'Reação leve. Use e ela estoura à sua frente num clarão azul: dano pequeno em volta (2,5 m). Boa para festas de aniversário de engenheiro.' },
  reacao_amarela: { name: 'Reação Química Amarela', icon: '🧪', price: 60, kind: 'misc', col: 0xffd040, desc: 'Reação intensa. Explosão amarela de 4 m que derruba e atordoa. O rótulo diz “não agite”. Ninguém lê.' },
  reacao_vermelha: { name: 'Reação Química Vermelha', icon: '🌋', price: 140, kind: 'misc', col: 0xff3a1a, desc: 'O que você quer, criar um vulcão em casa? Ok, nós te ajudamos. Abre um vulcão de bolso: erupção de 6 m, lava no chão por alguns segundos e um susto que a vila vai lembrar.' },
  porca_perfeita: { name: 'A Porca Perfeita', icon: '🔩', price: 30, kind: 'res', col: 0xc8c8d0, desc: 'Forjada em Brasaforja e medida com o fio de cabelo da barba do mestre. Não afrouxa nem em terremoto. Os tecnocratas montam robôs e torres com ela.' },
  parafuso_inexp: { name: 'O Parafuso Inespanável', icon: '🔧', price: 32, kind: 'res', col: 0xb8b8c8, desc: 'A rosca é tão justa que a chave cansa antes dele. Diz a lenda que um anão foi enterrado com um, para o caixão nunca abrir.' },
  engrenagem_diam: { name: 'A Engrenagem Diamantada', icon: '⚙', price: 70, kind: 'res', col: 0xd8e8ff, desc: 'Dentes com pó de diamante: nunca gasta. A Companhia de Latão compra todas que os anões fazem, e os anões cobram cada vez mais.' },
};
