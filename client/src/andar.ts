/* ANDAR POR CLASSE (03/11, Erling: "vamos nos focar em movimentação… cada classe tem um estilo de luta e de andar, e ainda temos as
   posturas que mudam um pouco o estilo de cada classe"; referência principal: Path of Exile 2, e também Diablo IV e World of Warcraft).

   O que se tirou deles:
   - PoE2: o corpo olha para onde a luta está e os pés vão para onde o jogador clicou. Recuando com monstro perto, o herói anda de costas
     um tempo (dá para continuar atacando enquanto se afasta); de lado, anda meio virado. A arma pesa: maça e martelo andam devagar e com
     passo plantado; arco e besta andam e atiram (o arqueiro vive de recuar atirando); a monja/lanceira é leve e saltitante.
   - Diablo IV: o ladino anda baixo e solto, troca de direção rápido; o bárbaro e o druida pisam pesado; o necromante e o feiticeiro andam
     eretos e calmos, quase sem balançar.
   - WoW: o paladino de placas anda reto, ombros firmes, braço do escudo fechado; o caçador anda solto com o arco abaixado; o anão é curto
     de passo e balança o corpo de um lado ao outro.

   Cada perfil multiplica o andar de base do corpo (characters.ts). `bp` = recuo de costas: quanto tempo o herói ainda encara o inimigo
   enquanto se afasta (s) e a velocidade de costas (fração). As posturas mexem por cima. */
import type { KitKey } from './kits';

export interface Gait {
  /** passada (comprimento) */ stride: number; /** balanço dos braços */ arm: number; /** inclinação do tronco ao andar */ lean: number;
  /** sobe-e-desce */ bob: number; /** torção do quadril/ombros */ twist: number; /** balanço lateral */ sway: number; /** peso do pé no chão */ stomp: number;
  /** quanto anda agachado (m) */ crouch: number; /** recuo de costas: [janela em s, velocidade] */ bp: [number, number];
}
const G = (stride: number, arm: number, lean: number, bob: number, twist: number, sway: number, stomp: number, crouch: number, bp: [number, number]): Gait => ({ stride, arm, lean, bob, twist, sway, stomp, crouch, bp });

const BY_KIT: Partial<Record<KitKey, Gait>> = {
  /* humano sem caminho: o andar de base */
  human: G(1, 1, 1, 1, 1, 1, 1, 0, [1.3, 0.82]),
  /* guerreiro do Norte: passo largo e decidido, ombros soltos, pisada firme (o bárbaro do Diablo, o guerreiro de maça do PoE2) */
  nordic: G(1.08, 1.05, 1.1, 1.1, 1.15, 1.1, 1.6, 0.01, [1.1, 0.78]),
  /* paladino: reto, controlado, braços pouco soltos — placas pesam; recua devagar, sempre de frente (o escudo à frente) */
  pal: G(0.94, 0.7, 0.75, 0.8, 0.7, 0.8, 1.8, 0, [1.8, 0.72]),
  /* anão: passo curto e rápido, balança de um lado ao outro, pé pesado */
  dwarf: G(0.92, 1.0, 1.0, 1.15, 1.2, 1.5, 1.6, 0, [1.2, 0.76]),
  /* elfa arqueira: leve, longa, quase sem sobe-e-desce; recuar atirando é o estilo dela (o ranger do PoE2) */
  /* 08/11 (Erling: "elfos não correm, apenas andam rápido — elfos precisam correr como todos"): corrida de verdade (sobe-e-desce, braços e tronco de quem corre), só mais leve no pé */
  elf: G(1.1, 1.0, 1.0, 0.95, 1.0, 0.8, 0.5, 0, [2.6, 0.92]),
  /* tecnocrata: passo medido, corpo reto, braços curtos (a manopla pesa) */
  tecno: G(0.96, 0.7, 0.8, 0.8, 0.7, 0.8, 1.1, 0, [1.6, 0.85]),
  technocrat: G(0.96, 0.7, 0.8, 0.8, 0.7, 0.8, 1.1, 0, [1.6, 0.85]),
  /* vampiro: o "ladino" do Karmika — baixo, leve, deslizando, troca de lado rápido; recua de costas quase na velocidade cheia */
  vam: G(1.1, 0.6, 1.25, 0.5, 1.3, 0.6, 0.1, 0.05, [1.6, 0.95]),
  /* lobisomem: curvado, passada larga e pesada, braços soltos (a besta já aparece no homem) */
  lob: G(1.12, 1.3, 1.5, 1.2, 1.25, 1.3, 1.7, 0.06, [0.9, 0.8]),
  /* mago: ereto e calmo, mal balança (o feiticeiro do D4, a feiticeira do PoE2); recua de costas para manter a mira */
  mag: G(0.9, 0.55, 0.6, 0.7, 0.6, 0.6, 0.4, 0, [2.0, 0.86]),
  /* bruxo: um pouco curvado, passo arrastado e lento, ombros caídos */
  bru: G(0.88, 0.5, 1.15, 0.75, 0.8, 0.9, 0.6, 0.03, [2.0, 0.84]),
  /* caçador de demônios: baixo e alerta, passos silenciosos, recua atirando a besta de mão (o caçador de demônios do D3/D4) */
  cac: G(1.04, 0.75, 1.2, 0.6, 1.0, 0.8, 0.3, 0.04, [2.2, 0.9]),
};
/* a arma também muda o andar (PoE2: o peso da arma manda) */
const BY_WEAPON: Record<string, Partial<Gait>> = {
  two: { stride: 0.95, arm: 0.6, stomp: 1.4, bp: [0.8, 0.9] }, /* duas mãos: devagar e pesado */
  dagger: { crouch: 0.04, lean: 1.2, bob: 0.7, stomp: 0.3 }, kunai: { crouch: 0.05, lean: 1.25, bob: 0.6, stomp: 0.2 },
  fence: { arm: 0.6, twist: 0.7, bob: 0.7 }, claw: { crouch: 0.05, lean: 1.4, arm: 1.2 }, club: { stomp: 1.3, arm: 1.1 },
  hxbow: { bp: [1.5, 1.05] }, bow: { bp: [1.6, 1.05] }, /* bp aqui e nas posturas = multiplicadores */
};
/* as posturas por cima: tanque fecha e pesa, ataque inclina e alarga, cura endireita, velocidade solta e quica, roubo de vida rasteja */
const BY_STANCE: Record<string, Partial<Gait>> = {
  tank: { stride: 0.88, arm: 0.6, bob: 0.8, stomp: 1.4, crouch: 0.04, bp: [1.6, 0.85] }, // multiplicadores (bp: janela × e velocidade ×)
  atk: { stride: 1.06, lean: 1.25, arm: 1.1, twist: 1.15, bp: [0.8, 1] },
  heal: { lean: 0.7, arm: 0.8, bob: 0.9 },
  speed: { stride: 1.12, bob: 1.25, stomp: 0.6, bp: [1.1, 1.08] },
  leech: { crouch: 0.06, lean: 1.3, arm: 0.8, stomp: 0.5 },
};
const mul = (a: Gait, b: Partial<Gait>): Gait => ({ stride: a.stride * (b.stride ?? 1), arm: a.arm * (b.arm ?? 1), lean: a.lean * (b.lean ?? 1), bob: a.bob * (b.bob ?? 1), twist: a.twist * (b.twist ?? 1), sway: a.sway * (b.sway ?? 1), stomp: a.stomp * (b.stomp ?? 1), crouch: a.crouch + (b.crouch ?? 0), bp: [a.bp[0] * (b.bp?.[0] ?? 1), a.bp[1] * (b.bp?.[1] ?? 1)] });
const cache = new Map<string, Gait>();
/** o andar do herói agora: classe (ou povo) × arma × postura */
export function gaitOf(kit: string, wcls: string, stance: string): Gait {
  const key = kit + '|' + wcls + '|' + stance; let g = cache.get(key); if (g) return g;
  g = BY_KIT[kit as KitKey] ?? BY_KIT.human!; const w = BY_WEAPON[wcls]; if (w) g = mul(g, w); const s = BY_STANCE[stance]; if (s) g = mul(g, s);
  g.bp = [Math.min(3, g.bp[0]), Math.min(1, g.bp[1])]; cache.set(key, g); return g;
}
