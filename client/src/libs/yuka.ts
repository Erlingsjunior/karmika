/* 11/11 Yuka (MIT) — a biblioteca de IA de jogo (Erling: "implementar e testar, não sei se já está implementado": estava instalada e sem uso).
   Primeiro uso: O CERCO. Bichos de corpo a corpo que perseguem o herói deixavam de vir em fila pelo mesmo lado: cada um ganha um veículo do
   Yuka com dois comportamentos de direção somados — chegar (ArriveBehavior) no seu lugar de uma roda em volta do herói e manter distância
   dos vizinhos (SeparationBehavior). O Yuka calcula a velocidade de cada veículo; o jogo aplica só esse empurrão de lado, por cima da
   perseguição normal (o jogo continua mandando em quem ataca e quando). ?noyuka desliga, para comparar. */
import { EntityManager, Vehicle, ArriveBehavior, SeparationBehavior, Vector3 as YV } from 'yuka';

interface Mob { id: number | string; pos: { x: number; z: number }; def: { speed: number; range: number; radius: number; kite?: number; passive?: boolean; fly?: number }; state: string; alive: boolean; active: boolean }
const ON = !/[?&]noyuka/.test(typeof location !== 'undefined' ? location.search : '');
const mgr = new EntityManager(), veh = new Map<Mob, { v: Vehicle; arrive: ArriveBehavior; seen: number }>(); let tick = 0;
export const yukaOn = () => ON;
/** chamado uma vez por quadro com todos os bichos ativos; `step` anda o bicho respeitando parede e água */
export function yukaSurround(list: Mob[], hero: { x: number; z: number }, dt: number, step: (e: Mob, dx: number, dz: number) => void) {
  if (!ON || dt <= 0) return; tick++;
  const ch: { e: Mob; a: number; d: number }[] = [];
  for (const e of list) { if (!e.active || !e.alive || e.state !== 'chase' || e.def.kite || e.def.passive || e.def.fly) continue; const dx = e.pos.x - hero.x, dz = e.pos.z - hero.z, d = Math.hypot(dx, dz); if (d > 12 || d < 0.2) continue; ch.push({ e, a: Math.atan2(dz, dx), d }); }
  if (ch.length >= 2) {
    /* a roda: N lugares igualmente espaçados; o primeiro lugar fica onde já está o bicho mais perto, e os outros seguem pela ordem do ângulo */
    ch.sort((p, q) => p.a - q.a); let near = 0; for (let i = 1; i < ch.length; i++) if (ch[i].d < ch[near].d) near = i; const n = ch.length, base = ch[near].a - near * (Math.PI * 2 / n);
    for (let i = 0; i < n; i++) { const { e } = ch[i], ang = base + i * (Math.PI * 2 / n), R = Math.max(1.1, e.def.range * 0.8 + e.def.radius * 0.4);
      let s = veh.get(e); if (!s) { const v = new Vehicle(); v.maxSpeed = Math.max(1.6, e.def.speed); v.maxForce = 30; v.mass = 1; v.boundingRadius = e.def.radius; v.updateNeighborhood = true; v.neighborhoodRadius = 2.2; v.updateOrientation = false;
        const arrive = new ArriveBehavior(new YV(), 1.5, 0.15), sep = new SeparationBehavior(); sep.weight = 1.6; v.steering.add(arrive); v.steering.add(sep); mgr.add(v); s = { v, arrive, seen: tick }; veh.set(e, s); }
      s.seen = tick; s.v.position.set(e.pos.x, 0, e.pos.z);
      /* o alvo do veículo não é o lugar final (do outro lado da roda o caminho reto passaria por dentro do herói): é um ponto da própria roda, até 50° adiante, na direção do lugar dele */
      let da = ang - ch[i].a; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2; const a2 = ch[i].a + Math.max(-0.9, Math.min(0.9, da)), rr = Math.max(R, ch[i].d);
      s.arrive.target.set(hero.x + Math.cos(a2) * rr, 0, hero.z + Math.sin(a2) * rr); }
    mgr.update(Math.min(dt, 0.1));
    for (const { e } of ch) { const s = veh.get(e)!; let dx = s.v.position.x - e.pos.x, dz = s.v.position.z - e.pos.z; /* só o lado: o avanço para o herói continua sendo o da perseguição do jogo */
      const tx = hero.x - e.pos.x, tz = hero.z - e.pos.z, tl = Math.hypot(tx, tz) || 1, along = (dx * tx + dz * tz) / tl; dx -= tx / tl * along; dz -= tz / tl * along; /* tira TODO o componente na direção do herói (para perto ou para longe): o cerco não pode impedir o bicho de chegar para bater */
      if (dx || dz) step(e, dx, dz); s.v.position.set(e.pos.x, 0, e.pos.z); }
  }
  if (tick % 120 === 0) for (const [e, s] of veh) if (tick - s.seen > 240) { mgr.remove(s.v); veh.delete(e); }
}
