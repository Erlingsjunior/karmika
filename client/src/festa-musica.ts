/* ---------- O REPERTÓRIO DA FESTA (Erling, 28/10/2026) ----------
   "uma lista de músicas bem humoradas imitando músicas de hoje (rock, country, pop)… highway to karmika… e eles tocam mesmo
   a música no estilo pedido, mas com o som de bardos".
   Os títulos brincam com sucessos conhecidos; as melodias e as letras são NOSSAS (geradas a partir de uma semente por música,
   só no estilo: andamento, escala, levada e progressão — nenhuma melodia ou letra real é copiada).
   O bardo canta os versos em balões; no refrão, a praça inteira canta junto. */
export type FestaStyle = 'giga' | 'rock' | 'country' | 'pop' | 'sertanejo' | 'balada';
export interface FestaSong { id: string; title: string; style: FestaStyle; bpm: number; root: number; minor?: boolean; seed: number; verso: string[]; refrao: string }

export const STYLE_INFO: Record<FestaStyle, { name: string; icon: string; col: string }> = {
  giga: { name: 'Giga do bardo', icon: '🪕', col: '#c8a060' },
  rock: { name: 'Rock', icon: '🤘', col: '#ff7a5a' },
  country: { name: 'Country', icon: '🤠', col: '#e0b048' },
  pop: { name: 'Pop', icon: '✨', col: '#ff9ad7' },
  sertanejo: { name: 'Sertanejo', icon: '🎻', col: '#9ad79a' },
  balada: { name: 'Balada', icon: '🕯', col: '#9ad7ff' },
};

/* raízes em Hz: Mi 164.8 · Lá 220 · Ré 293.7 · Sol 196 · Dó 261.6 · Fá 174.6 */
export const SONGS: FestaSong[] = [
  { id: 'giga', title: 'A Giga de Brasaforja', style: 'giga', bpm: 150, root: 293.66, seed: 1, verso: [], refrao: '' },
  { id: 'highway', title: 'Highway to Karmika', style: 'rock', bpm: 132, root: 164.81, minor: true, seed: 11,
    verso: ['Vendi a espada, comprei um alaúde…', 'O karma no vermelho e a estrada sem fim!', 'Nem o Olho segura essa carroça!'], refrao: 'Tô na estrada pra Karmikaaa! 🤘' },
  { id: 'smoke', title: 'Smoke on the Fountain', style: 'rock', bpm: 112, root: 196, minor: true, seed: 23,
    verso: ['O tecnocrata errou a fórmula…', 'E a fonte da praça virou chaminé!', 'A guarda veio, a guarda tossiu!'], refrao: 'Fumaça na fonteee, fogo no céu! 🔥' },
  { id: 'golems', title: 'We Will Rock Golems', style: 'rock', bpm: 84, root: 220, minor: true, seed: 37,
    verso: ['Pé no chão, mão na caneca!', 'O golem acordou de mau humor!', 'Bate o pé que ele vira cascalho!'], refrao: 'Vamos, vamos quebrar golem! 👊👊👏' },
  { id: 'jolene', title: 'Jolene, a Javalina', style: 'country', bpm: 118, root: 196, seed: 41,
    verso: ['Toda lua cheia ela invade a minha horta…', 'Você é a javalina mais linda do vale!', 'Mas o Garrick já afiou o espeto…'], refrao: 'Jolene, a javalina, foge do churrascooo! 🐗' },
  { id: 'friends', title: 'Friends in Low Taverns', style: 'country', bpm: 104, root: 220, seed: 53,
    verso: ['Cheguei de armadura no casamento do rei…', 'Mas meus amigos estão é na taverna de baixo!', 'Onde a cerveja é forte e a conta é fiado!'], refrao: 'Meus amigos moram na taverna de baixooo! 🍺' },
  { id: 'estrada', title: 'Leva Eu Pra Casa, Estrada de Terra', style: 'country', bpm: 96, root: 261.63, seed: 67,
    verso: ['Montanhas de Ormund, rio de Lumenhal…', 'A carroça a vapor quebrou outra vez!', 'Me leva pra casa, que o lar tem fonte!'], refrao: 'Estrada de terraaa, cadê minha carroça?! 🛤' },
  { id: 'badgoblin', title: 'Bad Goblin', style: 'pop', bpm: 120, root: 220, minor: true, seed: 79,
    verso: ['Ele rouba a sua bolsa e sorri…', 'Ele dorme de dia na caverna fria!', 'Mamãe goblin diz que ele é um anjo!'], refrao: 'Goblin malvado rouba e sai dançando! 😈' },
  { id: 'shake', title: 'Shake It Off, Esqueleto', style: 'pop', bpm: 128, root: 261.63, seed: 83,
    verso: ['Os ossos chacoalham na cripta…', 'O necromante disse que ele não sabe dançar!', 'Mas o esqueleto só quer se divertir!'], refrao: 'Chacoalha, chacoalha, esqueletooo! 💀' },
  { id: 'uptown', title: 'Uptown Dwarf', style: 'pop', bpm: 114, root: 174.61, seed: 97,
    verso: ['Barba trançada, machado dourado…', 'O anão chegou e a praça parou!', 'Até o ferreiro largou o martelo!'], refrao: 'O anão chegou na cidade altaaa! 🪓' },
  { id: 'desencarnadito', title: 'Desencarnadito', style: 'pop', bpm: 92, root: 220, minor: true, seed: 101,
    verso: ['Morri na terça, voltei na quarta…', 'Humano de novo, mas com sede de sangue!', 'Devagarinho a alma lembra quem eu fui!'], refrao: 'Desencarnaditooo, devagarinhooo! 👻' },
  { id: 'evidencias', title: 'Evidências do Karma', style: 'sertanejo', bpm: 76, root: 196, seed: 113,
    verso: ['Juro por Odin que não fui eu que roubei a relíquia…', 'O profeta da guilda lembrou da outra vida!', 'Quem reencarna leva o karma na garupa!'], refrao: 'São as evidências do karmaaa! 🎻' },
  { id: 'aisepego', title: 'Ai Se Eu Te Pego, Orc', style: 'sertanejo', bpm: 96, root: 246.94, seed: 127,
    verso: ['Sábado na praça a galera começou a dançar…', 'Passou o orc mais forte de Ormund!', 'Tomei coragem e chamei pra brigar!'], refrao: 'Ai se eu te pego, orc, te levo pra taverna! 💪' },
  { id: 'vela', title: 'Coração de Vela (a Décima)', style: 'balada', bpm: 70, root: 174.61, seed: 131,
    verso: ['Nove velas acesas na capela…', 'A décima é a que você esqueceu!', 'Volta, que a vela ainda está queimando!'], refrao: 'Acende a décima velaaa por mim! 🕯' },
];
export const songById = (id: string) => SONGS.find((s) => s.id === id) ?? SONGS[0];
export const DEFAULT_SETLIST = ['highway', 'jolene', 'badgoblin', 'evidencias'];
