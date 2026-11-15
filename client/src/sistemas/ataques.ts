/* 10/11 (Erling: "os NPCs precisam defender a cidade de monstros… muita coisa o jogo precisa fazer sozinho, pensando").
   ATAQUE À VILA: à noite, com o herói dentro de uma vila ou cidade, de tempos em tempos (8 a 14 min) um bando sai da mata e marcha até a praça.
   Os bichos escolhidos combinam com o nível do herói e com a hora (mortos-vivos e cães do inferno só de noite fechada). A guarda sai do posto
   e luta (npcs.ts); o herói pode ajudar. Se o bando cai: a vila agradece (karma bom, um pouco de ouro e a fama corre — barks.ts, fofoca).
   Se o herói vai embora, o bando se dispersa sozinho depois de 3 min. */
import { t as tr } from '../i18n';
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
  spawn(type: EnemyType, x: number, z: number, o: { name?: string; hpMul?: number; tag?: string; lvl?: number; aggro?: number; leash?: number; net?: string }): { alive: boolean; home: { x: number; y: number }; state: string; t: number };
  /** jogando junto: o bando é o MESMO para todos que estão por perto (14/11) */
  net?: { on(): boolean; myId(): number; send(t: string, m: object): void };
  clearTag(tag: string): void;
  log(msg: string, col: string): void;
  karma(n: number): void;
  gold(n: number): void;
}

const RAID: EnemyType[] = ['wolf', 'coyote', 'goblin', 'goblin_shaman', 'bandit', 'bandit_arch', 'zombie', 'skeleton', 'skel_arch', 'ghoul', 'imp', 'hellhound', 'spiderling', 'mudzombie', 'draugr_bers', 'werewolf', 'vampire'];
const LATE = new Set<EnemyType>(['zombie', 'skeleton', 'skel_arch', 'ghoul', 'hellhound', 'mudzombie', 'werewolf', 'vampire']);

export function createAtaques(K: AtkCtx) {
  let wait = 6 * 60 + Math.random() * 4 * 60, cur: { st: Settle; mobs: ReturnType<AtkCtx['spawn']>[]; t: number; tag: string; gid?: string; rows?: Row[]; lead?: string; ann?: number } | null = null, seq = 0;
  /* 14/11 (Erling: "meu amigo está sofrendo ataque na vila e eu, do lado dele, não vejo nada"): o bando era sorteado em cada máquina.
     Agora quem sorteia o ataque avisa a sala (e repete o aviso a cada 4 s, para quem chega depois); quem está por perto cria os MESMOS
     bichos com a mesma chave de rede, e daí em diante a sincronia normal dos monstros cuida de posição, vida, golpes e morte. */
  type Row = [string, number, number, number, number, number];
  const guests = new Map<string, { vila: string; mobs: ReturnType<AtkCtx['spawn']>[]; t: number; tag: string }>(), ended = new Set<string>();
  const r1 = (n: number) => Math.round(n * 10) / 10;
  function pick(lvl: number, deep: boolean): EnemyType[] {
    const ok = RAID.filter((t) => DEFS[t] && Math.abs((DEFS[t].lvl ?? 1) - lvl) <= 6 && (deep || !LATE.has(t)));
    return ok.length ? ok : ['wolf', 'goblin'];
  }
  function start(st: Settle) {
    const lvl = K.level(), deep = K.night() > 0.75, kinds = pick(lvl, deep), tag = 'raid' + ++seq, T = K.T;
    const gid = K.net?.on() ? `raid${K.net.myId()}x${Date.now().toString(36)}` : undefined, rows: Row[] = [];
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
      const ml = Math.max(1, lvl + Math.round(Math.random() * 2 - 1));
      const e = K.spawn(t, x, z, { tag, lvl: ml, hpMul: 0.8, aggro: 14, leash: 999, net: gid ? `${gid}_${rows.length}` : undefined });
      /* a "casa" do bando é a praça: eles marcham até lá, atacando o que encontrarem no caminho */
      e.home.x = cx + (Math.random() - 0.5) * 5; e.home.y = cz + (Math.random() - 0.5) * 5; e.state = 'return'; e.t = 0; mobs.push(e); rows.push([t, r1(x), r1(z), ml, r1(e.home.x), r1(e.home.y)]);
    }
    cur = { st, mobs, t: 0, tag, gid, rows, lead: DEFS[lead].name, ann: 0 };
    announce();
    K.log(tr(n > 1 ? 'ataque.inicio.bando' : 'ataque.inicio', { lider: DEFS[lead].name, vila: st.name }), '#ff9a6a'); void scx;
  }
  /** avisa a sala do bando que eu sorteei (só os bichos ainda vivos; a chave de cada um é o número dele na lista) */
  function announce() { if (!cur?.gid || !cur.rows || !K.net?.on()) return; K.net.send('x:raid', { g: cur.gid, s: cur.st.name, n: cur.lead, l: cur.rows.map((r, i) => (cur!.mobs[i].alive ? r : null)) }); }
  /** chegou o aviso do bando de outro jogador: se estou por perto, o mesmo bando nasce aqui */
  function join(m: Record<string, unknown>) {
    const g = String(m.g ?? ''); if (!g || guests.has(g) || ended.has(g) || cur?.gid === g || K.inside()) return;
    if (m.end) { ended.add(g); return; }
    const l = m.l as (Row | null)[]; if (!Array.isArray(l) || l.length > 12) return;
    const h = K.heroTile(), hx = h.x * K.T, hz = h.y * K.T, first = l.find((r) => r); if (!first || Math.hypot(first[1] - hx, first[2] - hz) > 140) return; /* longe: o aviso seguinte pega quando eu chegar */
    const tag = 'raidg' + ++seq, mobs: ReturnType<AtkCtx['spawn']>[] = [];
    l.forEach((r, i) => { if (!r || !DEFS[r[0] as EnemyType]) return; const e = K.spawn(r[0] as EnemyType, +r[1], +r[2], { tag, lvl: Math.max(1, +r[3] || 1), hpMul: 0.8, aggro: 14, leash: 999, net: `${g}_${i}` }); e.home.x = +r[4]; e.home.y = +r[5]; e.state = 'return'; e.t = 0; mobs.push(e); });
    if (!mobs.length) return;
    const vila = String(m.s ?? ''); guests.set(g, { vila, mobs, t: 0, tag }); wait = Math.max(wait, 5 * 60); /* o meu próprio sorteio espera: um ataque por vez */
    K.log(tr(mobs.length > 1 ? 'ataque.inicio.bando' : 'ataque.inicio', { lider: String(m.n ?? DEFS[l.find((r) => r)![0] as EnemyType].name), vila }), '#ff9a6a');
  }
  function tick(dt: number) {
    for (const [g, q] of guests) { q.t += dt;
      if (!q.mobs.some((x) => x.alive)) { guests.delete(g); ended.add(g); K.karma(6); K.gold(8 + Math.floor(K.level() * 1.5)); FAMA.push(tr('fama.defendeu', { vila: q.vila }), true); K.log(tr('ataque.vitoria', { vila: q.vila }), '#ffe08a'); }
      else if (ended.has(g) || q.t > 300) { guests.delete(g); ended.add(g); K.clearTag(q.tag); K.log(tr('ataque.dispersa', { vila: q.vila }), '#c8c0a8'); } }
    if (cur?.gid) { cur.ann = (cur.ann ?? 0) + dt; if (cur.ann > 4) { cur.ann = 0; announce(); } }
    if (cur) { cur.t += dt;
      const left = cur.mobs.filter((m) => m.alive).length;
      if (!left) { const st = cur.st; cur = null; K.karma(6); K.gold(8 + Math.floor(K.level() * 1.5)); FAMA.push(tr('fama.defendeu', { vila: st.name }), true); K.log(tr('ataque.vitoria', { vila: st.name }), '#ffe08a'); }
      else if (cur.t > 180) { if (cur.gid) K.net?.send('x:raid', { g: cur.gid, end: 1 }); K.clearTag(cur.tag); K.log(tr('ataque.dispersa', { vila: cur.st.name }), '#c8c0a8'); cur = null; }
      return; }
    if (K.inside() || K.night() < 0.55) return;
    wait -= dt; if (wait > 0) return;
    const h = K.heroTile(); const st = K.settlements().find((s) => Math.hypot(s.x - h.x, s.y - h.y) < s.radius + 3);
    if (!st) { wait = 30; return; }
    wait = 8 * 60 + Math.random() * 6 * 60; start(st);
  }
  return { tick, join, active: () => !!cur || guests.size > 0, force: () => { const h = K.heroTile(); const st = K.settlements().slice().sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0]; if (st && !cur) start(st); return st?.name; } };
}
