/* 10/11 (Erling: "os NPCs precisam defender a cidade de monstros… muita coisa o jogo precisa fazer sozinho, pensando").
   ATAQUE À VILA: à noite, com o herói dentro de uma vila ou cidade, de tempos em tempos (8 a 14 min) um bando sai da mata e marcha até a praça.
   Os bichos escolhidos combinam com o nível do herói e com a hora (mortos-vivos e cães do inferno só de noite fechada). A guarda sai do posto
   e luta (npcs.ts); o herói pode ajudar. Se o bando cai: a vila agradece (karma bom, um pouco de ouro e a fama corre — barks.ts, fofoca).
   Se o herói vai embora, o bando se dispersa sozinho depois de 3 min. */
import type { EnemyType } from '../world';
import { DEFS } from '../enemies';
import { FAMA } from '../barks';

type Settle = { name: string; x: number; y: number; radius: number; kind: string };
interface AtkCtx {
  T: number;
  settlements(): Settle[];
  heroTile(): { x: number; y: number };
  night(): number;
  inside(): boolean;
  level(): number;
  walkable(x: number, z: number): boolean;
  spawn(type: EnemyType, x: number, z: number, o: { name?: string; hpMul?: number; tag?: string; lvl?: number; aggro?: number; leash?: number }): { alive: boolean; home: { x: number; y: number }; state: string; t: number };
  clearTag(tag: string): void;
  log(msg: string, col: string): void;
  karma(n: number): void;
  gold(n: number): void;
}

const RAID: EnemyType[] = ['wolf', 'coyote', 'goblin', 'goblin_shaman', 'bandit', 'bandit_arch', 'zombie', 'skeleton', 'skel_arch', 'ghoul', 'imp', 'hellhound', 'spiderling', 'mudzombie', 'draugr_bers', 'werewolf', 'vampire'];
const LATE = new Set<EnemyType>(['zombie', 'skeleton', 'skel_arch', 'ghoul', 'hellhound', 'mudzombie', 'werewolf', 'vampire']);

export function createAtaques(K: AtkCtx) {
  let wait = 6 * 60 + Math.random() * 4 * 60, cur: { st: Settle; mobs: ReturnType<AtkCtx['spawn']>[]; t: number; tag: string } | null = null, seq = 0;
  function pick(lvl: number, deep: boolean): EnemyType[] {
    const ok = RAID.filter((t) => DEFS[t] && Math.abs((DEFS[t].lvl ?? 1) - lvl) <= 6 && (deep || !LATE.has(t)));
    return ok.length ? ok : ['wolf', 'goblin'];
  }
  function start(st: Settle) {
    const lvl = K.level(), deep = K.night() > 0.75, kinds = pick(lvl, deep), tag = 'raid' + ++seq, T = K.T;
    const n = 3 + Math.min(3, Math.floor(lvl / 12)) + (st.kind === 'city' ? 1 : 0);
    /* o bando nasce a ~24 m do herói (dentro do alcance em que os bichos são simulados), do lado de fora da vila, e marcha até onde ele está */
    const h = K.heroTile(), hx = h.x * T, hz = h.y * T, scx = (st.x + 0.5) * T, scz = (st.y + 0.5) * T;
    const out = Math.atan2(hz - scz, hx - scx), a0 = Math.hypot(hx - scx, hz - scz) > 6 ? out + (Math.random() - 0.5) * 1.2 : Math.random() * Math.PI * 2, R = 24, cx = hx, cz = hz;
    const lead = kinds[Math.floor(Math.random() * kinds.length)], mobs: ReturnType<AtkCtx['spawn']>[] = [];
    for (let i = 0; i < n; i++) {
      const t = Math.random() < 0.6 ? lead : kinds[Math.floor(Math.random() * kinds.length)];
      /* ponto livre (chão andável, fora de casa, muro e mobília): procura em volta do lugar sorteado */
      let x = cx + Math.cos(a0) * R, z = cz + Math.sin(a0) * R, found = false;
      for (let k = 0; k < 40 && !found; k++) { const aa = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.18, rr = R - (k % 5) * 1.5, jx = (Math.random() - 0.5) * 4, jz = (Math.random() - 0.5) * 4;
        const px = cx + Math.cos(aa) * rr + jx, pz = cz + Math.sin(aa) * rr + jz; if (K.walkable(px, pz) && K.walkable(px + 0.6, pz) && K.walkable(px - 0.6, pz) && K.walkable(px, pz + 0.6) && K.walkable(px, pz - 0.6)) { x = px; z = pz; found = true; } }
      if (!found) continue;
      const e = K.spawn(t, x, z, { tag, lvl: Math.max(1, lvl + Math.round(Math.random() * 2 - 1)), hpMul: 0.8, aggro: 14, leash: 999 });
      /* a "casa" do bando é a praça: eles marcham até lá, atacando o que encontrarem no caminho */
      e.home.x = cx + (Math.random() - 0.5) * 5; e.home.y = cz + (Math.random() - 0.5) * 5; e.state = 'return'; e.t = 0; mobs.push(e);
    }
    cur = { st, mobs, t: 0, tag };
    K.log(`⚔ ${DEFS[lead].name}${n > 1 ? ' e companhia' : ''} saem da mata e atacam ${st.name}! A guarda corre para a praça.`, '#ff9a6a'); void scx;
  }
  function tick(dt: number) {
    if (cur) { cur.t += dt;
      const left = cur.mobs.filter((m) => m.alive).length;
      if (!left) { const st = cur.st; cur = null; K.karma(6); K.gold(8 + Math.floor(K.level() * 1.5)); FAMA.push(`ajudou a defender ${st.name}`, true); K.log(`✦ ${st.name} respira. Os moradores saem das casas e agradecem.`, '#ffe08a'); }
      else if (cur.t > 180) { K.clearTag(cur.tag); K.log(`O bando se dispersa na mata ao redor de ${cur.st.name}.`, '#c8c0a8'); cur = null; }
      return; }
    if (K.inside() || K.night() < 0.55) return;
    wait -= dt; if (wait > 0) return;
    const h = K.heroTile(); const st = K.settlements().find((s) => Math.hypot(s.x - h.x, s.y - h.y) < s.radius + 3);
    if (!st) { wait = 30; return; }
    wait = 8 * 60 + Math.random() * 6 * 60; start(st);
  }
  return { tick, active: () => !!cur, force: () => { const h = K.heroTile(); const st = K.settlements().slice().sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0]; if (st && !cur) start(st); return st?.name; } };
}
