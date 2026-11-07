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

export function createLock() {
  let cur: Enemy | null = null, hitT = -99, t = 0, quiet = 0;
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
    update(dt: number, hx: number, hz: number, list: Enemy[], hold: number) {
      t += dt;
      const dist = (e: Enemy) => Math.hypot(e.pos.x - hx, e.pos.z - hz);
      const lost = cur && (!hostile(cur) || dist(cur) > hold || (t - hitT > 5 && dist(cur) > 9));
      if (lost) { const died = !!cur && !cur.alive; cur = null; if (died) { cur = nearest(9); if (cur) hitT = t; } }
      /* 07/11: o bicho que está correndo atrás de você conta de mais longe (12 m); parado, só até 7 m. Depois de você soltar fugindo, nada prende sozinho por um tempo */
      if (!cur && t >= quiet) { cur = chaser(12) ?? nearest(7); if (cur) hitT = t - 2; }
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
    clear() { cur = null; },
    /** 07/11 (Erling: "você corre de costas para ele por 1,5 s; se continua indo em frente, descola o foco e segue"): solta e não prende sozinho por `sec` s (ferir um bicho prende de novo) */
    release(sec: number) { cur = null; quiet = t + sec; },
  };
}
