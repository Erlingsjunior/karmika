/* HABILIDADES DE GRUPO EM JOGO (11/11). A lista está em grupo-habilidades.ts; aqui elas são aprendidas, lançadas e aplicadas.
   - APRENDER: pelos pontos gastos no caminho de talento da habilidade (a 1ª do caminho com 6 pontos, a 2ª com 16).
   - LANÇAR: pela barra de grupo (clique ou Alt+1…6). Sozinho, o efeito cai em você. Em grupo, vai para todos por perto (alvo "grupo", "área" e torres
     de área) ou para UM companheiro: o do arquétipo da trava onde a runa está (travas.ts). Ctrl segurado: em você mesmo.
   - SOMAR: bônus iguais somam com rendimento decrescente (100%, 60%, 40%, 25%) e têm teto que cresce com o grupo (25% com 2, até 60% com 8).
   Simplificações desta primeira versão (ditas ao Erling): "tomar o golpe pelo aliado" e "inimigos batem mais fraco" valem como redução de dano em quem
   recebe. 12/11: as torres e os robôs andam (torres-andantes.ts) e o caído é erguido de verdade (ERGUER, mais abaixo). */
import { GRUPO_SKILLS, grupoDe, type GSkill, type GEff, type GTipo } from '../grupo-habilidades';
import { travasOf, type Arq, ARQS } from './travas';
import type { KitKey } from '../kits';

export interface GrupoCtx {
  kit(): string; branchName(bi: number): string; /** nível do personagem */ lvl(): number; /** pontos livres do monte único (habilidades, passivas, talentos) */ avail(): number;
  st(): { hp: number; hpMax: number; dead?: boolean };
  set(v: { dmg: number; def: number; crit: number; haste: number; move: number; leech: number; guard: number; acc: number; dodge: number }): void; shield(v: number): void;
  log(t: string, c?: string): void; float(t: string, c: string): void; sound(): void; /** aro de luz no chão, na cor da runa */ ring(c: string): void;
  net(): { state: string; myId: number; party: { members: number[] } | null; x(t: string, m: Record<string, unknown>): void; onX(t: string, f: (from: number, m: Record<string, unknown>) => void): void; nameOf(id: number): string; remotes(): { id: number; pos: { distanceTo(v: unknown): number } }[] } | null;
  heroPos(): unknown;
  /** 12/11: a engenhoca que anda (torres-andantes.ts): nasce em `from`, vai até quem `follow` aponta e fica com ele por `dur` s */ torre?(id: string, from: { x: number; z: number }, follow: () => { x: number; z: number } | null, dur: number): void;
  /** 12/11: levanta o herói caído ali mesmo (lar-e-morte.ts); false se ele já ressurgiu na fonte */ erguer?(frac: number, quem: string, nome: string): boolean;
  /** 12/11: os pontos de magia de grupo acesos na árvore de talentos, para a magia `ord` (0 ou 1) do caminho `branch` */ gmods?(branch: number, ord: number): { pot: number; cd: number; dur: number };
}
/* 11/11 (Erling: "essas habilidades de grupo têm que estar na árvore de habilidades; não podem se concentrar em níveis altos: no 25 abre a primeira,
   depois no 30, no 35, até o 40 ou 45; depois, mais pontos nelas deixam elas mais fortes, como qualquer habilidade de hoje"):
   cada uma é um quadrado da árvore, abre por nível (25, 30, 35, 40, 45, 50), custa ponto do mesmo monte e sobe até 10. */
export const GRUPO_LVL = [25, 30, 35, 40, 45, 50], GRUPO_MAX = 10;
const COL: Record<GTipo, string> = { cura: '#7af0a0', defesa: '#8ac8ff', forca: '#ff9a5a', veloc: '#7ae8e0', olho: '#c9a0ff', chama: '#ffe08a' };
const GLYPH: Record<GTipo, string> = {
  cura: '<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>', defesa: '<path d="M12 2l8 3v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5z"/>', forca: '<path d="M4 20v-3c0-4 2-6 5-6l1-6c.3-2 4-2 4 0l-1 5c4 0 7 2 7 6v4z"/>',
  veloc: '<path d="M3 13c4-1 6-4 7-9 2 4 2 7 1 10h6c2 0 4 2 4 5H7c-3 0-4-3-4-6z"/>', olho: '<path d="M2 12c3-5 6-7 10-7s7 2 10 7c-3 5-6 7-10 7s-7-2-10-7zm10-3a3 3 0 100 6 3 3 0 000-6z" fill-rule="evenodd"/>', chama: '<path d="M12 2c1 4 5 6 5 11a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z"/>',
};
const TNOME: Record<GTipo, string> = { cura: 'Cura', defesa: 'Defesa', forca: 'Força', veloc: 'Velocidade', olho: 'Visão', chama: 'Purificação' };
/** a runa de pedra da habilidade: pedra lascada, com a marca gravada e acesa no meio */
export function runaPedra(s: GSkill, size = 56): string {
  const c = COL[s.tipo], id = 'rp' + s.id;
  return `<svg class="runap" viewBox="0 0 64 64" width="${size}" height="${size}" style="--rc:${c}"><defs><radialGradient id="${id}" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#a39c8e"/><stop offset=".55" stop-color="#5d574d"/><stop offset="1" stop-color="#2c2823"/></radialGradient></defs>
    <path d="M12 6 L44 3 L59 16 L61 44 L48 60 L18 61 L4 46 L3 20 Z" fill="url(#${id})" stroke="#1a1714" stroke-width="2" stroke-linejoin="round"/>
    <path d="M12 6 L44 3 L59 16" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1.6"/><path d="M61 44 L48 60 L18 61 L4 46" fill="none" stroke="rgba(0,0,0,.5)" stroke-width="2"/>
    <path d="M20 12 l5 7 M47 44 l-4 6 M14 40 l3 -5" stroke="rgba(0,0,0,.35)" stroke-width="1.2" fill="none"/>
    <circle cx="32" cy="32" r="19" fill="rgba(0,0,0,.55)"/><circle class="rhalo" cx="32" cy="32" r="18" fill="${c}" opacity=".14"/>
    <g class="rmark" transform="translate(17 17) scale(1.25)" fill="${c}" stroke="#fff8e0" stroke-width=".5" stroke-linejoin="round">${GLYPH[s.tipo]}</g></svg>`;
}
const pct = (v: number) => `${Math.round(v * 100)}%`;
function effTxt(e: GEff): string { const L: string[] = [];
  if (e.dmg) L.push(`+${pct(e.dmg)} dano`); if (e.def) L.push(`−${pct(e.def)} dano recebido`); if (e.crit) L.push(`+${pct(e.crit)} crítico`); if (e.haste) L.push(`+${pct(e.haste)} ritmo`); if (e.move) L.push(`+${pct(e.move)} velocidade`);
  if (e.heal) L.push(`cura ${pct(e.heal)}`); if (e.regen) L.push(`cura ${pct(e.regen)}/s`); if (e.shield) L.push(`escudo de ${pct(e.shield)}`); if (e.leech) L.push(`${pct(e.leech)} de roubo de vida`); if (e.guard) L.push(`+${pct(e.guard)} quebra de guarda`);
  if (e.acc) L.push(`+${e.acc} no dado`); if (e.dodge) L.push(`+${pct(e.dodge)} esquiva`); if (e.redirect) L.push(`toma ${pct(e.redirect)} dos golpes`); if (e.weaken) L.push(`inimigos −${pct(e.weaken)} dano`); if (e.cleanse) L.push('purifica'); if (e.revive) L.push('ergue o caído'); if (e.cost) L.push(`custa ${pct(e.cost)} da sua vida`);
  return L.join(' · '); }

/* 12/11 ERGUER O CAÍDO (Erling): três classes levantam um companheiro caído, ali mesmo, sem ele voltar para a fonte.
   Paladino: pela magia de grupo Luz que Levanta (30% da vida). Mago: o rito Fio de Volta, do nível 30 (25% da vida).
   Bruxo: o Contrato dos Mortos, do nível 30 (30% da vida para o caído; o Bruxo paga 30% da própria vida na hora). */
export const ERGUER: Record<string, { nome: string; frac: number; cost: number; cd: number; lvl: number; via?: string }> = {
  pal: { nome: 'Luz que Levanta', frac: 0.3, cost: 0, cd: 120, lvl: 0, via: 'g_luzlevanta' }, mag: { nome: 'Fio de Volta', frac: 0.25, cost: 0, cd: 180, lvl: 30 }, bru: { nome: 'Contrato dos Mortos', frac: 0.3, cost: 0.3, cd: 180, lvl: 30 } };
export function createGrupoMagias(K: GrupoCtx) {
  const mine = () => grupoDe(K.kit() as KitKey);
  /** ordem em que abrem: a 1ª de cada caminho (25, 30, 35), depois a 2ª de cada caminho (40, 45, 50) */
  const ordered = () => { const L = mine(); return [0, 1, 2].map((b) => L.filter((q) => q.branch === b)[0]).concat([0, 1, 2].map((b) => L.filter((q) => q.branch === b)[1])).filter(Boolean); };
  const gate = (s: GSkill) => GRUPO_LVL[Math.max(0, ordered().indexOf(s))] ?? 50;
  let ranks: Record<string, number> = (() => { try { return JSON.parse(localStorage.getItem('karmika.grupo.ranks') || '{}') as Record<string, number>; } catch { return {}; } })();
  const saveR = () => { try { localStorage.setItem('karmika.grupo.ranks', JSON.stringify(ranks)); } catch { /* */ } };
  /** teste (comando /runas): todas abertas, para conferir sem gastar pontos */ let testAll = (() => { try { return localStorage.getItem('karmika.grupoteste') === '1'; } catch { return false; } })();
  const rankOf = (s: GSkill) => ranks[s.id] ?? 0;
  const learned = (s: GSkill) => testAll || rankOf(s) > 0;
  const known = () => ordered().filter(learned);
  /** cada ponto além do primeiro: +5% no efeito */
  /* 12/11: os talentos da magia (Força, Pressa, Fôlego). Magia que não dura (cura na hora, escudo) troca o Fôlego por metade em efeito */
  const tm = (s: GSkill) => K.gmods?.(s.branch, mine().filter((q) => q.branch === s.branch).indexOf(s)) ?? { pot: 0, cd: 0, dur: 0 };
  const durOf = (s: GSkill) => s.dur > 1 ? Math.round(s.dur * (1 + tm(s).dur) * 10) / 10 : s.dur, cdOf = (s: GSkill) => Math.round(s.cd * (1 - tm(s).cd));
  const mult = (s: GSkill) => Math.min(1.75, (1 + 0.05 * Math.max(0, rankOf(s) - 1)) * (1 + tm(s).pot + (s.dur > 1 ? 0 : tm(s).dur * 0.5))); /* teto: grau 10 e talentos juntos não passam de +75% */
  const effOf = (s: GSkill): GEff => { const k = mult(s), o: GEff = {}; for (const [a, v] of Object.entries(s.eff)) (o as Record<string, unknown>)[a] = typeof v === 'number' && a !== 'cost' && a !== 'acc' ? v * k : v; return o; };
  const blocked = (s: GSkill): string | null => K.lvl() < gate(s) && !rankOf(s) ? `abre no nível ${gate(s)}` : rankOf(s) >= GRUPO_MAX ? `no máximo (${GRUPO_MAX})` : K.avail() <= 0 ? 'sem pontos' : null;
  function invest(id: string): string | null { const s = mine().find((q) => q.id === id); if (!s) return 'habilidade de outra classe'; const why = blocked(s); if (why) return why; ranks[id] = rankOf(s) + 1; saveR(); barKey = ''; renderBar(); K.log(ranks[id] === 1 ? `✨ ${s.name} aprendida! Lance pela barra de grupo.` : `+1 em ${s.name} (${ranks[id]}/${GRUPO_MAX}).`, COL[s.tipo]); return null; }
  /** pontos gastos nas habilidades de grupo (saem do mesmo monte) */ const spent = () => Object.values(ranks).reduce((a, b) => a + b, 0);
  const cds = new Map<string, number>(); const now = () => performance.now() / 1000;
  const active: { s: GSkill; e: GEff; until: number; from: string }[] = [];
  let papel: Arq | null = (() => { try { const v = localStorage.getItem('karmika.papel'); return v === 'tank' || v === 'dps' || v === 'heal' ? v : null; } catch { return null; } })();
  const papeis = new Map<number, Arq>();
  const partySize = () => { const n = K.net(); return n?.party && n.state === 'on' ? Math.max(1, n.party.members.length) : 1; };
  /** soma com rendimento decrescente e teto pelo tamanho do grupo */
  function total() { const t0 = now(); for (let i = active.length - 1; i >= 0; i--) if (active[i].until <= t0) active.splice(i, 1);
    const n = partySize(), cap = n <= 2 ? 0.25 : Math.min(0.6, 0.25 + (n - 2) * (0.35 / 6)), W = [1, 0.6, 0.4, 0.25];
    const sum = (f: (e: GEff) => number, c = cap) => { const v = active.map((a) => f(a.e)).filter((x) => x > 0).sort((a, b) => b - a); let r = 0; v.forEach((x, i) => { r += x * (W[i] ?? 0.25); }); return Math.min(c, r); };
    return { dmg: sum((e) => e.dmg ?? 0), def: sum((e) => (e.def ?? 0) + (e.redirect ?? 0) * 0.6 + (e.weaken ?? 0)), crit: sum((e) => e.crit ?? 0, 0.3), haste: sum((e) => e.haste ?? 0, 0.35), move: sum((e) => e.move ?? 0, 0.35), leech: sum((e) => e.leech ?? 0, 0.15), guard: sum((e) => e.guard ?? 0, 0.8), acc: Math.min(4, Math.round(sum((e) => (e.acc ?? 0) / 10, 0.4) * 10)), dodge: sum((e) => e.dodge ?? 0, 0.3), regen: sum((e) => e.regen ?? 0, 0.08) }; }
  function apply(s: GSkill, from: string, self: boolean, k = 1, dur = s.dur) { const st = K.st(); if (st.dead) return; const e: GEff = {}; for (const [a, v] of Object.entries(s.eff)) (e as Record<string, unknown>)[a] = typeof v === 'number' && a !== 'cost' && a !== 'acc' ? v * k : v;
    if (e.heal || e.revive) { const g = Math.round(st.hpMax * (e.heal ?? e.revive ?? 0)); st.hp = Math.min(st.hpMax, st.hp + g); K.float(`+${g}`, '#8ae08a'); }
    if (e.shield) K.shield(Math.round(st.hpMax * e.shield));
    if (s.dur > 1) active.push({ s, e, until: now() + dur, from });
    K.float(`${s.name}`, COL[s.tipo]); if (!self) K.ring(COL[s.tipo]); if (!self) K.log(`✦ ${from} lançou ${s.name} em você: ${effTxt(e)}.`, COL[s.tipo]); push(); renderBar(); }
  function push() { const t = total(); K.set(t); }
  setInterval(() => { const t = total(); K.set(t); const st = K.st(); if (t.regen > 0 && !st.dead && st.hp < st.hpMax) st.hp = Math.min(st.hpMax, st.hp + st.hpMax * t.regen * 0.5); renderBar(); }, 500);
  /** lança; devolve o motivo se não der */
  function cast(id: string, ctrl = false): string | null { const s = mine().find((q) => q.id === id); if (!s) return 'habilidade de outra classe'; if (!learned(s)) return K.lvl() < gate(s) ? `abre no nível ${gate(s)}` : 'ainda não aprendida (ponha um ponto nela na árvore)';
    const left = (cds.get(id) ?? 0) - now(); if (left > 0) return `recarga: ${Math.ceil(left)} s`; const st = K.st(); if (st.dead) return 'você está caído';
    if (s.eff.cost) { const c = Math.round(st.hpMax * s.eff.cost); if (st.hp <= c + 1) return 'vida insuficiente para pagar'; st.hp -= c; K.float(`−${c}`, '#ff8a7a'); }
    cds.set(id, now() + cdOf(s)); K.sound(); K.ring(COL[s.tipo]);
    const n = K.net(), inParty = !!n?.party && n.state === 'on' && n.party.members.length > 1;
    let to = 0; /* 0 = todos por perto; senão o id de um companheiro; -1 = só em mim */
    if (s.alvo === 'aliado' || (s.alvo === 'torre' && !s.eff.regen)) { to = -1;
      if (inParty && !ctrl) { const want = travasOf('g:' + s.id), me = K.heroPos(); const mates = n!.remotes().filter((r) => n!.party!.members.includes(r.id) && r.id !== n!.myId && r.pos.distanceTo(me) < 22);
        const pick = (want.length ? mates.filter((r) => want.includes(papeis.get(r.id) as Arq)) : mates).sort((a, b) => a.pos.distanceTo(me) - b.pos.distanceTo(me))[0];
        if (pick) to = pick.id; else if (want.length && papel && want.includes(papel)) to = -1; } }
    if (s.eff.revive && inParty) { const c = caidoPerto(22); if (c) { n!.x('x:erguer', { to: c.id, frac: Math.min(0.5, s.eff.revive * mult(s)), nome: s.name }); K.log(`✚ ${s.name}: você ergue ${c.name}.`, COL[s.tipo]); renderBar(); return null; } }
    if (s.alvo === 'torre') { const me = K.heroPos() as { x: number; z: number }, tid = to; K.torre?.(s.id, { x: me.x, z: me.z }, () => { if (tid > 0) { const r = K.net()?.remotes().find((q) => q.id === tid); if (r) return r.pos as unknown as { x: number; z: number }; } return K.heroPos() as { x: number; z: number }; }, durOf(s)); }
    if (to <= 0) apply(s, 'Você', true, mult(s), durOf(s));
    if (inParty && to !== -1) n!.x('x:gs', { id: s.id, to, k: mult(s), d: durOf(s) }); if (to > 0) K.log(`✦ ${s.name} foi para ${n!.nameOf(to)}.`, COL[s.tipo]);
    renderBar(); return null; }
  /* ---- erguer o caído ---- */
  const caidos = new Map<number, number>(); let eu = false, ritoCd = 0;
  /** o companheiro caído mais perto (até `r` metros) */
  function caidoPerto(r: number): { id: number; name: string; d: number } | null { const n = K.net(); if (!n?.party || n.state !== 'on') return null; const me = K.heroPos(), t0 = now(); let best: { id: number; name: string; d: number } | null = null;
    for (const m of n.remotes()) { const at = caidos.get(m.id); if (!at || t0 - at > 12 || !n.party.members.includes(m.id) || m.id === n.myId) continue; const d = m.pos.distanceTo(me); if (d < r && (!best || d < best.d)) best = { id: m.id, name: n.nameOf(m.id), d }; } return best; }
  /** dá para erguer alguém agora? devolve quem e com o quê (para o aviso "E — Erguer") */
  function erguivel(): { id: number; name: string; d: number; nome: string; why: string | null } | null { const R = ERGUER[K.kit()]; if (!R || K.st().dead) return null; const c = caidoPerto(5); if (!c) return null;
    const sk = R.via ? mine().find((q) => q.id === R.via) : null, left = sk ? (cds.get(sk.id) ?? 0) - now() : ritoCd - now();
    const why = sk && !learned(sk) ? `aprenda ${R.nome} na árvore de habilidades` : K.lvl() < R.lvl ? `${R.nome} abre no nível ${R.lvl}` : left > 0 ? `recarga: ${Math.ceil(left)} s` : R.cost && K.st().hp <= K.st().hpMax * R.cost + 1 ? 'vida insuficiente para pagar o contrato' : null;
    return { ...c, nome: R.nome, why }; }
  function erguer(): string | null { const e = erguivel(); if (!e) return 'ninguém caído por perto'; if (e.why) return e.why; const R = ERGUER[K.kit()], n = K.net()!, st = K.st();
    if (R.via) return cast(R.via);
    if (R.cost) { const c = Math.round(st.hpMax * R.cost); st.hp -= c; K.float(`−${c}`, '#ff8a7a'); }
    ritoCd = now() + R.cd; K.sound(); K.ring(K.kit() === 'bru' ? '#b06aff' : '#8ad0ff'); n.x('x:erguer', { to: e.id, frac: R.frac, nome: R.nome }); K.log(`✚ ${R.nome}: você ergue ${e.name}${R.cost ? ` e paga ${Math.round(R.cost * 100)}% da sua vida` : ''}.`, '#ffe08a'); return null; }
  /* avisa o grupo quando eu caio e quando volto; repete a cada 4 s enquanto caído (quem chegou depois também fica sabendo) */
  setInterval(() => { const n = K.net(), d = !!K.st().dead; if (!n?.party || n.state !== 'on') { eu = d; return; } if (d !== eu || d) { eu = d; n.x('x:caido', { on: d ? 1 : 0 }); } }, 1500);
  let wired: unknown = null;
  function wire() { const n = K.net(); if (!n || wired === n) return; wired = n;
    n.onX('x:gs', (from, m) => { if (!n.party?.members.includes(from)) return; const s = GRUPO_SKILLS.find((q) => q.id === m.id); if (!s) return; const to = Number(m.to) || 0; if (to > 0 && to !== n.myId) return;
      const r = n.remotes().find((q) => q.id === from); if (!r || r.pos.distanceTo(K.heroPos()) > (to > 0 ? 30 : 16)) return;
      if (s.alvo === 'torre') { const rp = r.pos as unknown as { x: number; z: number }, fid = from, mine2 = to > 0; K.torre?.(s.id, { x: rp.x, z: rp.z }, () => mine2 ? K.heroPos() as { x: number; z: number } : (K.net()?.remotes().find((q) => q.id === fid)?.pos as unknown as { x: number; z: number }) ?? null, Math.max(s.dur, Math.min(s.dur * 1.3 + 0.1, Number(m.d) || s.dur))); }
      apply(s, n.nameOf(from), false, Math.max(1, Math.min(1.75, Number(m.k) || 1)), Math.max(s.dur, Math.min(s.dur * 1.3 + 0.1, Number(m.d) || s.dur))); });
    n.onX('x:caido', (from, m) => { if (!n.party?.members.includes(from)) return; if (m.on) { if (!caidos.has(from)) K.log(`☠ ${n.nameOf(from)} caiu. Um Paladino, um Mago ou um Bruxo pode erguê-lo ali mesmo (chegue perto e aperte E).`, '#ff9a8a'); caidos.set(from, now()); } else caidos.delete(from); });
    n.onX('x:erguer', (from, m) => { if (Number(m.to) !== n.myId || !n.party?.members.includes(from)) return; const r = n.remotes().find((q) => q.id === from); if (!r || r.pos.distanceTo(K.heroPos()) > 30) return;
      K.erguer?.(Math.max(0.05, Math.min(0.5, Number(m.frac) || 0.25)), n.nameOf(from), String(m.nome || 'um rito')); });
    n.onX('x:papel', (from, m) => { const p = m.p; if (p === 'tank' || p === 'dps' || p === 'heal') papeis.set(from, p); else papeis.delete(from); }); }
  setInterval(() => { wire(); const n = K.net(); if (n?.party && n.state === 'on') n.x('x:papel', { p: papel ?? '' }); }, 4000);
  function setPapel(p: Arq | null) { papel = p; try { if (p) localStorage.setItem('karmika.papel', p); else localStorage.removeItem('karmika.papel'); } catch { /* */ } const n = K.net(); if (n?.party && n.state === 'on') n.x('x:papel', { p: p ?? '' }); }
  /* ---- a barra de grupo (HUD) ---- */
  const bar = document.createElement('div'); bar.id = 'grupobar'; document.body.appendChild(bar);
  let barKey = '';
  function renderBar() { const L = known(), t0 = now(); const key = L.map((s) => `${s.id}:${Math.ceil(Math.max(0, (cds.get(s.id) ?? 0) - t0))}:${active.some((a) => a.s === s) ? 1 : 0}`).join('|'); if (key === barKey) return; barKey = key;
    bar.style.display = L.length ? 'flex' : 'none';
    bar.innerHTML = L.map((s, i) => { const left = Math.ceil(Math.max(0, (cds.get(s.id) ?? 0) - t0)); return `<button class="gslot ${left ? 'cd' : ''} ${active.some((a) => a.s === s) ? 'act' : ''}" data-gcast="${s.id}" title="${s.name} (${TNOME[s.tipo]}) · Alt+${i + 1}\n${s.tip}\n${effTxt(effOf(s))} · ${s.dur > 1 ? durOf(s) + ' s · ' : ''}recarga ${cdOf(s)} s">${runaPedra(s, 44)}<kbd>⎇${i + 1}</kbd>${left ? `<b>${left}</b>` : ''}</button>`; }).join(''); }
  bar.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('[data-gcast]') as HTMLElement | null; if (!b) return; const why = cast(b.dataset.gcast!, e.ctrlKey); if (why) K.log(`Não dá: ${why}.`, '#ff9a8a'); });
  addEventListener('keydown', (e) => { if (!e.altKey || e.repeat) return; const i = '123456'.indexOf(e.key); if (i < 0) return; const t = e.target as HTMLElement | null; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return; const s = known()[i]; if (!s) return; e.preventDefault(); const why = cast(s.id, e.ctrlKey); if (why) K.log(`Não dá: ${why}.`, '#ff9a8a'); });
  /* ---- os quadrados na árvore de habilidades (uma fileira própria embaixo, ligada por um trilho) ---- */
  let gsel: string | null = null;
  function treeNodes(rows: number, W: number, H: number, NS: number): { html: string; lines: string; rows: number } { const L = ordered(); if (!L.length) return { html: '', lines: '', rows: 0 };
    const cx = (i: number) => i * W + 58, cy = rows * H + 46;
    const lines = L.map((s, i) => i ? `<path d="M${cx(i - 1) + NS} ${cy} H${cx(i) - NS}" fill="none" stroke="${rankOf(L[i - 1]) && rankOf(s) ? '#ffd24a' : '#4a3a28'}" stroke-width="2" stroke-dasharray="${rankOf(L[i - 1]) && rankOf(s) ? '' : '4 5'}"/>` : '').join('') + `<text x="${cx(0) - NS}" y="${cy - NS - 12}" fill="#d9a24f" font-family="Cinzel, Georgia, serif" font-size="11" font-weight="700" letter-spacing="2">MAGIAS DE GRUPO</text>`;
    const html = L.map((s, i) => { const rk = rankOf(s), why = blocked(s), cur = travasOf('g:' + s.id), ok = learned(s);
      return `<div class="tn gtn ${ok ? 'on' : ''} ${gsel === s.id ? 'sel' : ''} ${!rk && !why ? 'can' : ''} ${!ok && why ? 'lk' : ''}" style="left:${cx(i) - NS}px;top:${cy - NS}px;--c:${COL[s.tipo]}" data-gn="${s.id}" title="${s.name}"><div class="ic">${runaPedra(s, NS * 2 - 14)}</div>
        ${ok ? `<span class="rn2">${[0, 1].map((q) => cur[q] ? `<i class="rn used" title="Runa na trava ${ARQS.find((a) => a.id === cur[q])!.name}"><svg viewBox="0 0 24 24">${GLYPH[s.tipo]}</svg></i>` : `<i class="rn" draggable="true" data-rune="g:${s.id}" title="Runa de ${TNOME[s.tipo]}: arraste para uma trava (Tanque, Dano ou Healer)"><svg viewBox="0 0 24 24">${GLYPH[s.tipo]}</svg></i>`).join('')}</span>` : ''}
        <span class="pips">${Array.from({ length: GRUPO_MAX }, (_, k) => `<i class="${k < rk ? 'f' : ''}"></i>`).join('')}</span><b>${rk}/${GRUPO_MAX}</b><kbd>${rk ? '⎇' + (known().indexOf(s) + 1) : '🔒' + gate(s)}</kbd><em>${s.name}</em></div>`; }).join('');
    return { html, lines, rows: 1 }; }
  /** a ficha da habilidade de grupo selecionada (ocupa o lugar da ficha da magia), ou null */
  function detail(): string | null { const s = mine().find((q) => q.id === gsel); if (!s) return null; const rk = rankOf(s), why = blocked(s), e = effOf(s), nx: GEff = {}; for (const [a, v] of Object.entries(s.eff)) (nx as Record<string, unknown>)[a] = typeof v === 'number' && a !== 'cost' && a !== 'acc' ? v * (1 + 0.05 * rk) : v;
    return `<div class="th"><div class="ic" style="--c:${COL[s.tipo]}">${runaPedra(s, 50)}</div><div><b>${s.name}</b><small>Magia de grupo · ${TNOME[s.tipo]} · ${rk ? `${rk}/${GRUPO_MAX}` : 'não aprendida'}</small></div></div>
      <p class="tip">${s.tip}</p>
      <div class="lines sgrid"><div class="sc"><small>✦ Efeito agora</small><b>${effTxt(rk ? e : s.eff)}</b></div><div class="sc"><small>◎ Vai para</small><b>${s.alvo === 'aliado' ? 'um aliado (o da trava)' : s.alvo === 'grupo' ? 'o grupo por perto' : s.alvo === 'area' ? 'quem está na área' : 'torre ao lado do aliado'}</b></div>${s.dur > 1 ? `<div class="sc"><small>⏳ Duração</small><b>${durOf(s)} s</b></div>` : ''}<div class="sc"><small>↻ Recarga</small><b>${cdOf(s)} s</b></div>${(() => { const t = tm(s), L2 = [t.pot ? 'Força' : '', t.cd ? 'Pressa' : '', t.dur ? 'Fôlego' : ''].filter(Boolean); return `<div class="sn">Talentos desta magia (no caminho ${K.branchName(s.branch)} da árvore de talentos): ${L2.length ? L2.join(', ') + ' acesos.' : 'nenhum aceso. Há três: Força, Pressa e Fôlego.'}</div>`; })()}
        <div class="sn">Abre no nível ${gate(s)}. Lance pela barra de grupo (Alt+1 a 6). Sozinho, o efeito cai em você. As duas runas ao lado do quadrado vão para as travas.</div></div>
      <div class="gain"><small>${rk >= GRUPO_MAX ? 'Magia no máximo' : rk ? `Com mais um ponto: ${effTxt(nx)}` : 'Cada ponto depois do primeiro dá +5% no efeito'}</small></div>
      <button class="inv ${why ? 'off' : ''}" data-ginv="${s.id}" ${why ? 'disabled' : ''}>${why ? why : rk ? `+1 ponto em ${s.name}` : `Aprender ${s.name} (1 ponto)`}</button>`; }
  const papelHtml = () => `<span class="gpapel">Meu papel no grupo: ${ARQS.map((a) => `<button data-gpapel="${a.id}" class="${papel === a.id ? 'on' : ''}">${a.name}</button>`).join('')}</span>`;
  function panelClick(t: HTMLElement, again: () => void): boolean {
    const b = t.closest('[data-gpapel]') as HTMLElement | null; if (b) { const p = b.dataset.gpapel as Arq; setPapel(papel === p ? null : p); again(); return true; }
    const iv = t.closest('[data-ginv]') as HTMLElement | null; if (iv) { if (!iv.hasAttribute('disabled')) { const why = invest(iv.dataset.ginv!); if (why) K.log(`Não dá: ${why}.`, '#ff9a8a'); } again(); return true; }
    if (t.closest('[data-rune]')) return false;
    const g = t.closest('[data-gn]') as HTMLElement | null; if (g) { gsel = g.dataset.gn!; again(); return true; }
    return false; }
  /** as habilidades de grupo aprendidas, no formato que as travas esperam */
  const forLocks = () => known().map((s) => ({ k: 'g:' + s.id, name: s.name, svg: runaPedra(s, 22), c: COL[s.tipo] }));
  renderBar();
  return { erguivel, erguer, cast, known, learned, treeNodes, detail, papelHtml, clearSel() { gsel = null; }, spent, invest, panelClick, forLocks, renderBar, get papel() { return papel; }, total, testToggle() { testAll = !testAll; try { localStorage.setItem('karmika.grupoteste', testAll ? '1' : '0'); } catch { /* */ } barKey = ''; renderBar(); return testAll; } };
}
