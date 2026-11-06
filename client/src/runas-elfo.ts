/* AS RUNAS EM CADA MAGIA DO ELFO (06/11, Erling: "segue" — item 3 da programação).
   O compêndio de toda classe descreve o que cada uma das 6 runas faz em CADA magia ativa (claude/compendio-<classe>.md).
   No jogo, até aqui, a runa fazia a mesma coisa em qualquer magia (runas-magia.ts → RNAT). O Elfo é a primeira classe com o efeito
   próprio de cada runa em cada magia. Este módulo é só dados: o texto (o que o jogador lê no encaixe) e as peças do efeito que o
   gameplay sabe montar. O gameplay usa o efeito próprio no lugar do genérico daquela família; o preço da Fresta continua o mesmo.

   Peças do efeito no ACERTO (hit):
     slow s · freezeN n s (a cada n acertos no mesmo alvo, congela s) · burn s · echo atraso mul (o mesmo golpe de novo) ·
     seek n mul (salta para n inimigos perto) · mark s (+dano recebido e crítico) · pull m (puxa para você) · knock m (empurra) ·
     root s (prende/atordoa) · boom mul r atraso (explosão no alvo) · deathBoom mul r (se morrer, explode) · fireGround r s ·
     iceGround r s (chão que retarda) · healHit pct (cura você pelo acerto)
   Peças no LANÇAMENTO (cast): heal pct · cdr k (recarga ×k) · aura s (aliados perto curam: vira cura sua no solo) */
import type { RFam } from './runas-magia';

export type ROp =
  | { t: 'slow'; s: number } | { t: 'freezeN'; n: number; s: number } | { t: 'burn'; s: number } | { t: 'echo'; d: number; mul: number }
  | { t: 'seek'; n: number; mul: number } | { t: 'mark'; s: number } | { t: 'pull'; m: number } | { t: 'knock'; m: number } | { t: 'root'; s: number }
  | { t: 'boom'; mul: number; r: number; d?: number } | { t: 'deathBoom'; mul: number; r: number } | { t: 'fireGround'; r: number; s: number }
  | { t: 'iceGround'; r: number; s: number } | { t: 'healHit'; pct: number }
  /* 06/11: as mecânicas que faltavam (Erling: "coloque todas as mecânicas necessárias") */
  | { t: 'blinkBehind' } | { t: 'cough'; s: number } | { t: 'grow' } | { t: 'raise'; s: number } | { t: 'allyHeal'; pct: number };
export type RCastOp = { t: 'heal'; pct: number } | { t: 'cdr'; k: number } | { t: 'phase'; s: number } | { t: 'thorns'; pct: number; s: number } | { t: 'projImmune'; s: number } | { t: 'allyHeal'; pct: number } | { t: 'fillRes'; n: number };
export interface RuneFx { txt: string; hit?: ROp[]; cast?: RCastOp[] }

const F = (txt: string, hit?: ROp[], cast?: RCastOp[]): RuneFx => ({ txt, hit, cast });
export const ELF_RUNES: Record<string, Partial<Record<RFam, RuneFx>>> = {
  combo: {
    lagrima: F('Pontas de gelo: cada acerto retarda; no 5º acerto o alvo congela 0,8 s.', [{ t: 'slow', s: 1.5 }, { t: 'freezeN', n: 5, s: 0.8 }]),
    olho: F('A 3ª flecha persegue o alvo: os acertos marcam o ponto fraco por 2 s.', [{ t: 'mark', s: 2 }]),
    ampulheta: F('Cada flecha deixa um eco que acerta o mesmo ponto 1 s depois (35%).', [{ t: 'echo', d: 1, mul: 0.35 }]),
    labirinto: F('Sai uma 2ª flecha em curva que procura o inimigo mais perto do alvo (60%).', [{ t: 'seek', n: 1, mul: 0.6 }]),
    fome: F('As flechas acendem: queimam 3 s; quem morre em chamas acende o próximo.', [{ t: 'burn', s: 3 }, { t: 'deathBoom', mul: 0.4, r: 3 }]),
    fresta: F('A flecha reaparece a 1 m do alvo: impossível de desviar (+dano da Fresta).', []),
  },
  backleap: {
    lagrima: F('Fica uma poça de orvalho onde você saltou: retarda quem passa e cura você 4%.', [{ t: 'iceGround', r: 2.5, s: 4 }], [{ t: 'heal', pct: 0.04 }]),
    olho: F('A flecha do salto marca o alvo: crítico e +dano por 3 s.', [{ t: 'mark', s: 3 }]),
    ampulheta: F('O salto volta 40% mais rápido.', [], [{ t: 'cdr', k: 0.6 }]),
    labirinto: F('Solta 3 flechas no ar, uma em cada inimigo mais perto.', [{ t: 'seek', n: 2, mul: 0.8 }]),
    fome: F('A pegada de fogo explode 1 s depois em quem seguiu você (200%).', [{ t: 'boom', mul: 2, r: 2.5, d: 1 }]),
    fresta: F('Você some numa fresta: quem levou a flecha é jogado longe.', [{ t: 'knock', m: 4 }]),
  },
  windarrow: {
    lagrima: F('O vento vira neblina gelada: o rastro retarda 35% por 3 s.', [{ t: 'slow', s: 3 }, { t: 'iceGround', r: 1.5, s: 3 }]),
    olho: F('A flecha passa pelo ponto fraco do maior da linha: +60% e marca.', [{ t: 'mark', s: 3 }]),
    ampulheta: F('O vento sopra de volta pelo mesmo caminho (50%).', [{ t: 'echo', d: 2, mul: 0.5 }]),
    labirinto: F('Saem 3 flechas em leque que se cruzam: o acerto salta para mais 2.', [{ t: 'seek', n: 2, mul: 0.7 }]),
    fome: F('Vira uma lança de fogo: o rastro arde 3 s.', [{ t: 'burn', s: 3 }, { t: 'fireGround', r: 1.5, s: 3 }]),
    fresta: F('A fresta no fim da linha puxa os atingidos de volta, amontoados.', [{ t: 'pull', m: 3 }]),
  },
  vinesnare: {
    lagrima: F('Seiva azul: depois de solto, o alvo fica lento 50% por 3 s.', [{ t: 'slow', s: 3 }]),
    olho: F('Os cipós prendem a alma: o preso recebe +dano de todas as suas flechas.', [{ t: 'mark', s: 3 }]),
    ampulheta: F('Os cipós soltam e prendem de novo 1,5 s depois.', [{ t: 'echo', d: 1.5, mul: 0.4 }, { t: 'root', s: 1 }]),
    labirinto: F('Os cipós se espalham e prendem também até 3 inimigos perto.', [{ t: 'seek', n: 3, mul: 0.5 }]),
    fome: F('Espinho-de-brasa: o preso sangra e, se morrer, explode em farpas.', [{ t: 'burn', s: 3 }, { t: 'deathBoom', mul: 1.2, r: 3 }]),
    fresta: F('Os cipós arrastam o alvo para debaixo da terra: ele volta atordoado.', [{ t: 'root', s: 1.5 }]),
  },
  volley: {
    lagrima: F('Granizo: quem é atingido fica lento e o chão vira gelo por 4 s.', [{ t: 'slow', s: 2 }, { t: 'freezeN', n: 6, s: 1 }]),
    olho: F('As flechas procuram os inimigos; quem leva 6 marca o ponto fraco.', [{ t: 'mark', s: 1.5 }]),
    ampulheta: F('Cai um eco da chuva no mesmo lugar (50%).', [{ t: 'echo', d: 2, mul: 0.5 }]),
    labirinto: F('Cada flecha que acerta salta para mais um perto (40%).', [{ t: 'seek', n: 1, mul: 0.4 }]),
    fome: F('As flechas caem em chamas e o chão arde.', [{ t: 'burn', s: 2 }, { t: 'fireGround', r: 1.2, s: 3 }]),
    fresta: F('A chuva cai de frestas bem em cima de cada inimigo (+dano da Fresta).', []),
  },
  thorntrap: {
    lagrima: F('Flor d\'água: a poça retarda por 5 s e cura você 2%.', [{ t: 'iceGround', r: 3, s: 5 }, { t: 'healHit', pct: 0.02 }]),
    olho: F('A armadilha enxerga: marca quem pisou.', [{ t: 'mark', s: 4 }]),
    ampulheta: F('A raiz estoura duas vezes: na pisada e 2 s depois, maior.', [{ t: 'boom', mul: 1.5, r: 3.5, d: 2 }]),
    labirinto: F('O estouro corre por um cipó até os inimigos perto.', [{ t: 'seek', n: 2, mul: 0.7 }]),
    fome: F('Os espinhos pegam fogo e o mato arde por 4 s.', [{ t: 'burn', s: 3 }, { t: 'fireGround', r: 2.5, s: 4 }]),
    fresta: F('Quem pisa cai na fresta e é jogado 8 m para trás, atordoado.', [{ t: 'knock', m: 8 }, { t: 'root', s: 1 }]),
  },
  companion: {
    lagrima: F('Pelagem de orvalho: os ataques do animal retardam.', [{ t: 'slow', s: 1.5 }], [{ t: 'heal', pct: 0.05 }]),
    olho: F('O animal ataca o seu alvo e marca o ponto fraco.', [{ t: 'mark', s: 2 }]),
    ampulheta: F('O animal volta na metade do tempo.', [], [{ t: 'cdr', k: 0.5 }]),
    labirinto: F('A mordida pega também o inimigo ao lado.', [{ t: 'seek', n: 1, mul: 0.65 }]),
    fome: F('O animal fica selvagem: rouba vida para você a cada ataque.', [{ t: 'healHit', pct: 0.01 }]),
    fresta: F('O animal pisca para as costas do alvo: o golpe derruba.', [{ t: 'root', s: 0.6 }]),
  },
  tensebow: {
    lagrima: F('Cristal de gelo: estilhaça e retarda quem estiver atrás.', [{ t: 'slow', s: 2.5 }, { t: 'seek', n: 2, mul: 0.4 }]),
    olho: F('Mira o coração: marca o alvo por 4 s.', [{ t: 'mark', s: 4 }]),
    ampulheta: F('Um eco do mesmo tiro sai 1 s depois (40%).', [{ t: 'echo', d: 1, mul: 0.4 }]),
    labirinto: F('A flecha ricocheteia até 3 vezes.', [{ t: 'seek', n: 3, mul: 0.6 }]),
    fome: F('A flecha entra em brasa e explode dentro do alvo depois de 1 s (+150%).', [{ t: 'boom', mul: 1.5, r: 3, d: 1 }]),
    fresta: F('A flecha atravessa paredes e terreno (+dano da Fresta).', []),
  },
  featherfan: {
    lagrima: F('Gotas de chuva cortante: cada acerto retarda (soma).', [{ t: 'slow', s: 2 }]),
    olho: F('As flechas se fecham no alvo e marcam o ponto fraco.', [{ t: 'mark', s: 1.5 }]),
    ampulheta: F('O leque é solto de novo 0,6 s depois.', [{ t: 'echo', d: 0.6, mul: 0.6 }]),
    labirinto: F('Mais flechas: cada acerto salta para mais um.', [{ t: 'seek', n: 1, mul: 0.5 }]),
    fome: F('Farpas em brasa: queimam e, se o alvo morrer, ele explode (120%).', [{ t: 'burn', s: 2 }, { t: 'deathBoom', mul: 1.2, r: 2.5 }]),
    fresta: F('O leque sai de uma fresta atrás do alvo (+dano da Fresta).', []),
  },
  sapheal: {
    lagrima: F('A seiva escorre para fora: cura +8%.', [], [{ t: 'heal', pct: 0.08 }]),
    olho: F('A muda enxerga quem te feriu: a recarga cai 20%.', [], [{ t: 'cdr', k: 0.8 }]),
    ampulheta: F('Cura mais devagar, mas cura +15% no total.', [], [{ t: 'heal', pct: 0.15 }]),
    labirinto: F('A muda brota em 3 pontos: cura +6%.', [], [{ t: 'heal', pct: 0.06 }]),
    fome: F('A muda bebe dos inimigos a 5 m: cura +10%.', [], [{ t: 'heal', pct: 0.1 }]),
    fresta: F('A cura vem toda de uma vez (+10%).', [], [{ t: 'heal', pct: 0.1 }]),
  },
  leafstep: {
    lagrima: F('O boneco é de folhas molhadas: você cura 5% ao sair.', [], [{ t: 'heal', pct: 0.05 }]),
    olho: F('Ao reaparecer, o primeiro tiro enxerga o ponto fraco (recarga −20%).', [], [{ t: 'cdr', k: 0.8 }]),
    ampulheta: F('Volta 40% mais rápido.', [], [{ t: 'cdr', k: 0.6 }]),
    labirinto: F('Ficam 3 bonecos (recarga −25%).', [], [{ t: 'cdr', k: 0.75 }]),
    fome: F('O boneco de folhas secas explode em fogo (250%) quando se desfaz.', [{ t: 'boom', mul: 2.5, r: 3 }]),
    fresta: F('Você fica intocável dentro da fresta por um instante (+cura 3%).', [], [{ t: 'heal', pct: 0.03 }]),
  },
  hawkfeather: {
    lagrima: F('A pena pinga: o alvo fica lento.', [{ t: 'slow', s: 4 }]),
    olho: F('A pena vira um olho: o alvo fica marcado por 8 s.', [{ t: 'mark', s: 8 }]),
    ampulheta: F('Quando a pena cai, ela voa para o mais perto e recomeça.', [{ t: 'echo', d: 4, mul: 0.6 }]),
    labirinto: F('Solta 3 penas em 3 alvos.', [{ t: 'seek', n: 2, mul: 1 }]),
    fome: F('Pena de fênix: o alvo queima e, se morrer, passa a pena adiante.', [{ t: 'burn', s: 6 }, { t: 'deathBoom', mul: 0.8, r: 4 }]),
    fresta: F('A pena puxa o alvo para a sua linha de tiro.', [{ t: 'pull', m: 3 }]),
  },
  seedpod: {
    lagrima: F('Seiva fria: a área fica grudenta (lento 60%).', [{ t: 'slow', s: 4 }, { t: 'iceGround', r: 4, s: 5 }]),
    olho: F('A vagem procura o mais forte e o marca.', [{ t: 'mark', s: 4 }]),
    ampulheta: F('A vagem racha e estoura de novo 2 s depois, maior (+40%).', [{ t: 'boom', mul: 1.4, r: 6, d: 2 }]),
    labirinto: F('Estoura em 4 vagens menores que rolam para os lados.', [{ t: 'seek', n: 3, mul: 0.5 }]),
    fome: F('Pimenta-de-fogo: a área arde por 4 s.', [{ t: 'burn', s: 3 }, { t: 'fireGround', r: 3, s: 4 }]),
    fresta: F('A fresta suga todos para o centro antes de estourar.', [{ t: 'pull', m: 3 }]),
  },
  wisp: {
    lagrima: F('Fogo-fátuo azul: as faíscas retardam e curam você um pouco.', [{ t: 'slow', s: 1.5 }, { t: 'healHit', pct: 0.005 }]),
    olho: F('Ilumina o alvo: as faíscas marcam o ponto fraco.', [{ t: 'mark', s: 1.5 }]),
    ampulheta: F('Dura mais e volta mais rápido.', [], [{ t: 'cdr', k: 0.7 }]),
    labirinto: F('As faíscas saltam para mais um inimigo.', [{ t: 'seek', n: 1, mul: 0.6 }]),
    fome: F('Fogo-fátuo vermelho: as faíscas queimam.', [{ t: 'burn', s: 2 }]),
    fresta: F('O fogo-fátuo pisca para perto do alvo (+dano da Fresta).', []),
  },
  thornwall: {
    lagrima: F('O espinheiro dá flores azuis: você cura 6%.', [], [{ t: 'heal', pct: 0.06 }]),
    olho: F('O muro tem olhos de seiva: recarga −20%.', [], [{ t: 'cdr', k: 0.8 }]),
    ampulheta: F('O muro volta 30% mais rápido.', [], [{ t: 'cdr', k: 0.7 }]),
    labirinto: F('O muro nasce maior (recarga −15%).', [], [{ t: 'cdr', k: 0.85 }]),
    fome: F('O espinheiro pega fogo: as flechas que passam saem em chamas.', [{ t: 'burn', s: 2 }]),
    fresta: F('Quem tenta atravessar é jogado para trás.', [{ t: 'knock', m: 6 }]),
  },
  cyclone: {
    lagrima: F('Ciclone de chuva: quem está dentro fica lento e sai molhado.', [{ t: 'slow', s: 2 }, { t: 'freezeN', n: 6, s: 1 }]),
    olho: F('O olho do ciclone: quem fica no meio é marcado.', [{ t: 'mark', s: 1 }]),
    ampulheta: F('O ciclone dura mais: cada corte ecoa (30%).', [{ t: 'echo', d: 0.5, mul: 0.3 }]),
    labirinto: F('Os cortes ricocheteiam em mais 2 inimigos.', [{ t: 'seek', n: 2, mul: 0.35 }]),
    fome: F('Tornado de fogo: queima, e no fim explode para fora (300%).', [{ t: 'burn', s: 2 }]),
    fresta: F('O meio é uma fresta: os inimigos são puxados com força.', [{ t: 'pull', m: 1.5 }]),
  },
  lithsong: {
    lagrima: F('Canção de chuva: cura 8%.', [], [{ t: 'heal', pct: 0.08 }]),
    olho: F('Com o Olho, a canção volta mais rápido.', [], [{ t: 'cdr', k: 0.8 }]),
    ampulheta: F('A canção ecoa: volta 35% mais rápido.', [], [{ t: 'cdr', k: 0.65 }]),
    labirinto: F('As notas pulam: cura 4% e volta mais rápido.', [], [{ t: 'heal', pct: 0.04 }, { t: 'cdr', k: 0.9 }]),
    fome: F('Canção de guerra (a Fome no golpe vale mais).', []),
    fresta: F('A canção é ouvida do outro lado: cura 10%.', [], [{ t: 'heal', pct: 0.1 }]),
  },
  ancestorbark: {
    lagrima: F('Bétula molhada: cura 10%.', [], [{ t: 'heal', pct: 0.1 }]),
    olho: F('Quem tem a casca vê as emboscadas: recarga −20%.', [], [{ t: 'cdr', k: 0.8 }]),
    ampulheta: F('A casca volta mais rápido.', [], [{ t: 'cdr', k: 0.65 }]),
    labirinto: F('A casca se espalha: cura 5%.', [], [{ t: 'heal', pct: 0.05 }]),
    fome: F('A casca vira espinhenta (a Fome nos golpes queima).', []),
    fresta: F('A casca de sombra: cura 6%.', [], [{ t: 'heal', pct: 0.06 }]),
  },
  wildhunt: {
    lagrima: F('Pegadas de orvalho: as mordidas retardam e você cura 10%.', [{ t: 'slow', s: 2 }], [{ t: 'heal', pct: 0.1 }]),
    olho: F('Todos caçam o seu alvo: cada mordida marca o ponto fraco.', [{ t: 'mark', s: 2 }]),
    ampulheta: F('A Caçada volta mais rápido.', [], [{ t: 'cdr', k: 0.7 }]),
    labirinto: F('O bando se divide: cada mordida pega mais um.', [{ t: 'seek', n: 1, mul: 0.5 }]),
    fome: F('Feras em chamas: quem é mordido queima.', [{ t: 'burn', s: 3 }]),
    fresta: F('Os animais saem de frestas: as mordidas derrubam.', [{ t: 'root', s: 0.5 }]),
  },
  oakarrow: {
    lagrima: F('A linha de flores vira um rio de seiva: lento 60% por 8 s.', [{ t: 'slow', s: 4 }, { t: 'iceGround', r: 2, s: 8 }]),
    olho: F('A flecha marca todos que atravessa.', [{ t: 'mark', s: 6 }]),
    ampulheta: F('3 s depois, a flecha volta pelo mesmo caminho (60%).', [{ t: 'echo', d: 3, mul: 0.6 }]),
    labirinto: F('Ao chegar no fim, o galho se abre em ramos que voltam em leque.', [{ t: 'seek', n: 3, mul: 0.6 }]),
    fome: F('A linha inteira explode em chamas e o chão arde 6 s.', [{ t: 'boom', mul: 2, r: 3, d: 0.6 }, { t: 'fireGround', r: 3, s: 6 }]),
    fresta: F('A flecha atravessa o Entre: ignora paredes (+dano da Fresta).', []),
  },
};
/** o efeito próprio da runa nesta magia (ou null: vale o genérico) */
export const runeFxOf = (kit: string, id: string | null | undefined, f: RFam): RuneFx | null => (kit === 'elf' && id ? ELF_RUNES[id]?.[f] ?? null : null);
/** o texto que o jogador lê no encaixe: o que o jogo faz de verdade com cada runa nesta magia (null: vale o compêndio/genérico) */
export function ownRuneText(kit: string, id: string): Record<string, string> | null { if (kit !== 'elf') return null; const m = ELF_RUNES[id]; if (!m) return null; const o: Record<string, string> = {}; for (const [f, fx] of Object.entries(m)) if (fx) o[f] = fx.txt; return o; }
