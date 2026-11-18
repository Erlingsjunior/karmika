/* ALVO PRESO INVISÍVEL (04/11, Erling: "o personagem fica sempre de frente com o monstro que ele está brigando, como se tivesse um ponto
   invisível que os prende… nosso jogo é sem marcador, mas temos um marcador automático invisível que foca no monstro que estamos batendo").
   Não aparece nada na tela. O jogo escolhe sozinho com quem você está brigando:
   - o último bicho que você FERIU (golpe, flecha, bala, magia — o primeiro projétil que acerta já trava) vira o alvo; trocar é só acertar outro.
     Golpe em área que acerta vários de uma vez não fica pulando: vale o primeiro, e o alvo só troca se o atual ficou 0,6 s sem ser ferido;
   - sem ter ferido ninguém ainda, o bicho hostil mais perto que está vindo (até 7 m);
   - quando o alvo morre, passa para o mais perto (até 9 m), para a luta seguir sem o herói virar de costas no meio do bando.
   O alvo NÃO prende o jogador (Erling: "tem que respeitar nosso movimento: se a gente se virar pra outro monstro e atacar, o target muda"):
   - começou um golpe ou magia virado para outro bicho (cone de ~40° na direção do golpe, até 9 m) → o alvo troca para ele na hora;
   - andou na direção de outro bicho (até 7 m, dentro de ~25° do caminho) e o alvo atual ficou para o lado ou para trás → troca também.
   Solta quando: você se afasta além do alcance da classe (arqueira e caçador seguram de mais longe), ou fica 5 s sem ferir e já está a
   mais de 9 m. Enquanto preso: parado ou andando, o corpo olha para o alvo; os pés vão para onde você manda (de costas, de lado, na diagonal). */
import type { Enemy } from './enemies';

/* 16/11 (Erling: "o focus precisa ter um código muito bem feito porque cada classe pode precisar usar o focus diferente: um guerreiro de contato
   pode ter uma necessidade diferente da de um mago ou de um arqueiro que ataca de longe; o focus será uma junção da proximidade com as minhas
   ações; estou em focus em um bicho mas coloquei o mouse em cima de outro e lancei uma magia: a magia vai no bicho do mouse e o focus muda
   para lá; o focus está sempre seguindo o mouse").
   O que mudou:
   - PERFIL POR CLASSE. Corpo a corpo: como era (o mais perto que vem vindo; segura até o alcance da classe). De longe (mago, bruxo, arco,
     arma de fogo, tecnocrata): quando não há alvo, vale o bicho mais perto DO MOUSE, não do herói; segura de mais longe; e quando o alvo
     morre, o próximo é o mais perto do mouse.
   - O MOUSE MANDA. Lançar magia ou bater com o mouse em cima de um bicho troca o foco para ele na hora (quem chama é a entrada). Só deixar o
     mouse parado em cima de um bicho também troca, depois de um instante: 0,12 s para quem bate de longe, 0,3 s para o corpo a corpo (para o
     herói não ficar girando quando o mouse só passa por cima do bando). */
export interface PerfilFoco { /** a classe bate de longe */ longe: boolean; /** onde o mouse toca o chão */ mx: number; mz: number; /** o mouse se mexeu há pouco (quem joga só no teclado ou no controle não é governado por um mouse esquecido) */ mouseVivo: boolean }
export function createLock() {
  let cur: Enemy | null = null, hitT = -99, t = 0, quiet = 0, sobre: Enemy | null = null, sobreT = 0;
  const hostile = (e: Enemy | null): e is Enemy => !!e && e.alive && e.active && !e.def.passive && !(e as Enemy & { ally?: boolean }).ally;
  return {
    /** o herói feriu este bicho */
    struck(e: Enemy) { if (!hostile(e)) return; quiet = 0;
      /* golpe em área, bola de fogo, raio em cadeia, chumbo de escopeta: acertam vários no mesmo instante. O alvo só troca se o atual NÃO
         foi ferido nos últimos 0,6 s — o primeiro atingido da rajada fica, e a mira não pula de bicho em bicho a cada faísca */
      if (cur !== e && hostile(cur) && t - hitT < 0.6) return;
      if (cur === e || !hostile(cur) || t - hitT >= 0.6) { cur = e; hitT = t; } },
    get target() { return cur; },
    /** chamar todo quadro; `hold` = alcance da classe (m) antes de soltar */
    update(dt: number, hx: number, hz: number, list: Enemy[], hold: number, pf?: PerfilFoco) {
      t += dt; const longe = !!pf?.longe; if (longe) hold += 6;
      /** o hostil mais perto do mouse (até `rm` m do mouse) que ainda está ao alcance do herói */
      const doMouse = (rm: number) => { if (!pf || !pf.mouseVivo) return null; let b: Enemy | null = null, bd = rm; for (const e of list) { if (!hostile(e) || dist(e) > hold) continue; const dm = Math.hypot(e.pos.x - pf.mx, e.pos.z - pf.mz); if (dm < bd) { bd = dm; b = e; } } return b; };
      const dist = (e: Enemy) => Math.hypot(e.pos.x - hx, e.pos.z - hz);
      const lost = cur && (!hostile(cur) || dist(cur) > hold || (t - hitT > 5 && dist(cur) > 9));
      if (lost) { const died = !!cur && !cur.alive; cur = null; if (died) { cur = (longe ? doMouse(7) : null) ?? nearest(longe ? 14 : 9); if (cur) hitT = t; } }
      /* 07/11: o bicho que está correndo atrás de você conta de mais longe (12 m); parado, só até 7 m. Depois de você soltar fugindo, nada prende sozinho por um tempo */
      if (!cur && t >= quiet) { cur = (longe ? doMouse(6) : null) ?? chaser(longe ? 16 : 12) ?? nearest(longe ? 10 : 7); if (cur) hitT = t - 2; }
      function chaser(r: number) { let b: Enemy | null = null, bd = r; for (const e of list) { if (!hostile(e) || (e.state !== 'chase' && e.state !== 'windup')) continue; const d = dist(e); if (d < bd) { bd = d; b = e; } } return b; }
      function nearest(r: number) { let b: Enemy | null = null, bd = r; for (const e of list) { if (!hostile(e)) continue; const d = dist(e); if (d < bd) { bd = d; b = e; } } return b; }
      return cur;
    },
    /** o bicho mais perto da linha `yaw` (dentro do cone `cosMin`, até `r` m), ou null */
    inCone(hx: number, hz: number, yaw: number, list: Enemy[], cosMin: number, r: number) { const fx = Math.sin(yaw), fz = Math.cos(yaw); let b: Enemy | null = null, bs = 1e9;
      for (const e of list) { if (!hostile(e)) continue; const dx = e.pos.x - hx, dz = e.pos.z - hz, d = Math.hypot(dx, dz); if (d > r || d < 0.2) continue; const c = (dx * fx + dz * fz) / d; if (c < cosMin) continue; const sc = d * (2 - c); if (sc < bs) { bs = sc; b = e; } }
      return b; },
    /** a intenção do jogador manda: atacou virado para outro bicho, ou andou na direção dele → o alvo passa a ser esse */
    retarget(e: Enemy | null) { if (!e || e === cur || !hostile(e)) return; cur = e; hitT = t; },
    /** o mouse está em cima deste bicho (ou de nenhum): ficando um instante, o foco passa para ele */
    hover(e: Enemy | null, dt: number, longe: boolean) { if (!e || !hostile(e)) { sobre = null; sobreT = 0; return; } if (e !== sobre) { sobre = e; sobreT = 0; } sobreT += dt; if (e !== cur && sobreT >= (longe ? 0.12 : 0.3)) { cur = e; hitT = t; quiet = 0; } },
    clear() { cur = null; },
    /** 07/11 (Erling: "você corre de costas para ele por 1,5 s; se continua indo em frente, descola o foco e segue"): solta e não prende sozinho por `sec` s (ferir um bicho prende de novo) */
    release(sec: number) { cur = null; quiet = t + sec; },
  };
}
