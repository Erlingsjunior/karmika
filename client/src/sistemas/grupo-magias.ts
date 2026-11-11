/* HABILIDADES DE GRUPO EM JOGO (11/11). A lista está em grupo-habilidades.ts; aqui elas são aprendidas, lançadas e aplicadas.
   - APRENDER: pelos pontos gastos no caminho de talento da habilidade (a 1ª do caminho com 6 pontos, a 2ª com 16).
   - LANÇAR: pela barra de grupo (clique ou Alt+1…6). Sozinho, o efeito cai em você. Em grupo, vai para todos por perto (alvo "grupo", "área" e torres
     de área) ou para UM companheiro: o do arquétipo da trava onde a runa está (travas.ts). Ctrl segurado: em você mesmo.
   - SOMAR: bônus iguais somam com rendimento decrescente (100%, 60%, 40%, 25%) e têm teto que cresce com o grupo (25% com 2, até 60% com 8).
   Simplificações desta primeira versão (ditas ao Erling): "tomar o golpe pelo aliado" e "inimigos batem mais fraco" valem como redução de dano em quem
   recebe; torres e robôs ainda não andam (o efeito é aplicado direto); "levantar o caído" cura quem está de pé. */
import { GRUPO_SKILLS, grupoDe, type GSkill, type GEff, type GTipo } from '../grupo-habilidades';
import { travasOf, type Arq, ARQS } from './travas';
import type { KitKey } from '../kits';

export interface GrupoCtx {
  kit(): string; inBranch(bi: number): number; branchName(bi: number): string;
  st(): { hp: number; hpMax: number; dead?: boolean };
  set(v: { dmg: number; def: number; crit: number; haste: number; move: number; leech: number; guard: number; acc: number; dodge: number }): void; shield(v: number): void;
  log(t: string, c?: string): void; float(t: string, c: string): void; sound(): void;
  net(): { state: string; myId: number; party: { members: number[] } | null; x(t: string, m: Record<string, unknown>): void; onX(t: string, f: (from: number, m: Record<string, unknown>) => void): void; nameOf(id: number): string; remotes(): { id: number; pos: { distanceTo(v: unknown): number } }[] } | null;
  heroPos(): unknown;
}
export const GRUPO_REQ = [6, 16];
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

export function createGrupoMagias(K: GrupoCtx) {
  const mine = () => grupoDe(K.kit() as KitKey);
  const need = (s: GSkill) => GRUPO_REQ[mine().filter((q) => q.branch === s.branch).indexOf(s)] ?? GRUPO_REQ[0];
  /** teste (comando /runas): todas abertas, para conferir sem gastar pontos */ let testAll = (() => { try { return localStorage.getItem('karmika.grupoteste') === '1'; } catch { return false; } })();
  const learned = (s: GSkill) => testAll || K.inBranch(s.branch) >= need(s);
  const known = () => mine().filter(learned);
  const cds = new Map<string, number>(); const now = () => performance.now() / 1000;
  const active: { s: GSkill; until: number; from: string }[] = [];
  let papel: Arq | null = (() => { try { const v = localStorage.getItem('karmika.papel'); return v === 'tank' || v === 'dps' || v === 'heal' ? v : null; } catch { return null; } })();
  const papeis = new Map<number, Arq>();
  const partySize = () => { const n = K.net(); return n?.party && n.state === 'on' ? Math.max(1, n.party.members.length) : 1; };
  /** soma com rendimento decrescente e teto pelo tamanho do grupo */
  function total() { const t0 = now(); for (let i = active.length - 1; i >= 0; i--) if (active[i].until <= t0) active.splice(i, 1);
    const n = partySize(), cap = n <= 2 ? 0.25 : Math.min(0.6, 0.25 + (n - 2) * (0.35 / 6)), W = [1, 0.6, 0.4, 0.25];
    const sum = (f: (e: GEff) => number, c = cap) => { const v = active.map((a) => f(a.s.eff)).filter((x) => x > 0).sort((a, b) => b - a); let r = 0; v.forEach((x, i) => { r += x * (W[i] ?? 0.25); }); return Math.min(c, r); };
    return { dmg: sum((e) => e.dmg ?? 0), def: sum((e) => (e.def ?? 0) + (e.redirect ?? 0) * 0.6 + (e.weaken ?? 0)), crit: sum((e) => e.crit ?? 0, 0.3), haste: sum((e) => e.haste ?? 0, 0.35), move: sum((e) => e.move ?? 0, 0.35), leech: sum((e) => e.leech ?? 0, 0.15), guard: sum((e) => e.guard ?? 0, 0.8), acc: Math.min(4, Math.round(sum((e) => (e.acc ?? 0) / 10, 0.4) * 10)), dodge: sum((e) => e.dodge ?? 0, 0.3), regen: sum((e) => e.regen ?? 0, 0.08) }; }
  function apply(s: GSkill, from: string, self: boolean) { const st = K.st(); if (st.dead) return;
    if (s.eff.heal || s.eff.revive) { const g = Math.round(st.hpMax * (s.eff.heal ?? s.eff.revive ?? 0)); st.hp = Math.min(st.hpMax, st.hp + g); K.float(`+${g}`, '#8ae08a'); }
    if (s.eff.shield) K.shield(Math.round(st.hpMax * s.eff.shield));
    if (s.dur > 1) active.push({ s, until: now() + s.dur, from });
    K.float(`${s.name}`, COL[s.tipo]); if (!self) K.log(`✦ ${from} lançou ${s.name} em você: ${effTxt(s.eff)}.`, COL[s.tipo]); push(); renderBar(); }
  function push() { const t = total(); K.set(t); }
  setInterval(() => { const t = total(); K.set(t); const st = K.st(); if (t.regen > 0 && !st.dead && st.hp < st.hpMax) st.hp = Math.min(st.hpMax, st.hp + st.hpMax * t.regen * 0.5); renderBar(); }, 500);
  /** lança; devolve o motivo se não der */
  function cast(id: string, ctrl = false): string | null { const s = mine().find((q) => q.id === id); if (!s) return 'habilidade de outra classe'; if (!learned(s)) return `abre com ${need(s)} pontos em ${K.branchName(s.branch)}`;
    const left = (cds.get(id) ?? 0) - now(); if (left > 0) return `recarga: ${Math.ceil(left)} s`; const st = K.st(); if (st.dead) return 'você está caído';
    if (s.eff.cost) { const c = Math.round(st.hpMax * s.eff.cost); if (st.hp <= c + 1) return 'vida insuficiente para pagar'; st.hp -= c; K.float(`−${c}`, '#ff8a7a'); }
    cds.set(id, now() + s.cd); K.sound();
    const n = K.net(), inParty = !!n?.party && n.state === 'on' && n.party.members.length > 1;
    let to = 0; /* 0 = todos por perto; senão o id de um companheiro; -1 = só em mim */
    if (s.alvo === 'aliado' || (s.alvo === 'torre' && !s.eff.regen)) { to = -1;
      if (inParty && !ctrl) { const want = travasOf('g:' + s.id), me = K.heroPos(); const mates = n!.remotes().filter((r) => n!.party!.members.includes(r.id) && r.id !== n!.myId && r.pos.distanceTo(me) < 22);
        const pick = (want.length ? mates.filter((r) => want.includes(papeis.get(r.id) as Arq)) : mates).sort((a, b) => a.pos.distanceTo(me) - b.pos.distanceTo(me))[0];
        if (pick) to = pick.id; else if (want.length && papel && want.includes(papel)) to = -1; } }
    if (to <= 0) apply(s, 'Você', true);
    if (inParty && to !== -1) n!.x('x:gs', { id: s.id, to }); if (to > 0) K.log(`✦ ${s.name} foi para ${n!.nameOf(to)}.`, COL[s.tipo]);
    renderBar(); return null; }
  let wired: unknown = null;
  function wire() { const n = K.net(); if (!n || wired === n) return; wired = n;
    n.onX('x:gs', (from, m) => { if (!n.party?.members.includes(from)) return; const s = GRUPO_SKILLS.find((q) => q.id === m.id); if (!s) return; const to = Number(m.to) || 0; if (to > 0 && to !== n.myId) return;
      const r = n.remotes().find((q) => q.id === from); if (!r || r.pos.distanceTo(K.heroPos()) > (to > 0 ? 30 : 16)) return; apply(s, n.nameOf(from), false); });
    n.onX('x:papel', (from, m) => { const p = m.p; if (p === 'tank' || p === 'dps' || p === 'heal') papeis.set(from, p); else papeis.delete(from); }); }
  setInterval(() => { wire(); const n = K.net(); if (n?.party && n.state === 'on') n.x('x:papel', { p: papel ?? '' }); }, 4000);
  function setPapel(p: Arq | null) { papel = p; try { if (p) localStorage.setItem('karmika.papel', p); else localStorage.removeItem('karmika.papel'); } catch { /* */ } const n = K.net(); if (n?.party && n.state === 'on') n.x('x:papel', { p: p ?? '' }); }
  /* ---- a barra de grupo (HUD) ---- */
  const bar = document.createElement('div'); bar.id = 'grupobar'; document.body.appendChild(bar);
  let barKey = '';
  function renderBar() { const L = known(), t0 = now(); const key = L.map((s) => `${s.id}:${Math.ceil(Math.max(0, (cds.get(s.id) ?? 0) - t0))}:${active.some((a) => a.s === s) ? 1 : 0}`).join('|'); if (key === barKey) return; barKey = key;
    bar.style.display = L.length ? 'flex' : 'none';
    bar.innerHTML = L.map((s, i) => { const left = Math.ceil(Math.max(0, (cds.get(s.id) ?? 0) - t0)); return `<button class="gslot ${left ? 'cd' : ''} ${active.some((a) => a.s === s) ? 'act' : ''}" data-gcast="${s.id}" title="${s.name} (${TNOME[s.tipo]}) · Alt+${i + 1}\n${s.tip}\n${effTxt(s.eff)} · ${s.dur > 1 ? s.dur + ' s · ' : ''}recarga ${s.cd} s">${runaPedra(s, 44)}<kbd>⎇${i + 1}</kbd>${left ? `<b>${left}</b>` : ''}</button>`; }).join(''); }
  bar.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('[data-gcast]') as HTMLElement | null; if (!b) return; const why = cast(b.dataset.gcast!, e.ctrlKey); if (why) K.log(`Não dá: ${why}.`, '#ff9a8a'); });
  addEventListener('keydown', (e) => { if (!e.altKey || e.repeat) return; const i = '123456'.indexOf(e.key); if (i < 0) return; const t = e.target as HTMLElement | null; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return; const s = known()[i]; if (!s) return; e.preventDefault(); const why = cast(s.id, e.ctrlKey); if (why) K.log(`Não dá: ${why}.`, '#ff9a8a'); });
  /* ---- o quadro dentro da janela de habilidades (em cima das travas) ---- */
  function panelHtml(): string { const L = mine(); if (!L.length) return '';
    return `<div class="gpanel"><div class="lkh"><b>Habilidades de grupo</b><small>Duas por caminho de talento. Abrem com ${GRUPO_REQ[0]} e ${GRUPO_REQ[1]} pontos gastos no caminho. Lance pela barra de grupo (Alt+1 a 6). As runas pequenas ao lado de cada pedra vão para as travas.</small>
      <span class="gpapel">Meu papel: ${ARQS.map((a) => `<button data-gpapel="${a.id}" class="${papel === a.id ? 'on' : ''}">${a.name}</button>`).join('')}</span></div>
      <div class="gcols">${[0, 1, 2].map((bi) => `<div class="gcol"><em>${K.branchName(bi)} <i>${K.inBranch(bi)} pts</i></em>${L.filter((s) => s.branch === bi).map((s) => { const ok = learned(s), cur = travasOf('g:' + s.id);
        return `<div class="gsk ${ok ? 'ok' : 'no'}" title="${s.tip}">${runaPedra(s, 54)}<div><b>${s.name}</b><small>${TNOME[s.tipo]} · ${s.alvo === 'aliado' ? 'um aliado' : s.alvo === 'grupo' ? 'o grupo' : s.alvo === 'area' ? 'área' : 'torre'} · ${effTxt(s.eff)}</small><small class="gst">${ok ? `${s.dur > 1 ? s.dur + ' s · ' : ''}recarga ${s.cd} s` : `abre com ${need(s)} pontos em ${K.branchName(s.branch)}`}</small></div>
          ${ok ? `<span class="rn2s">${[0, 1].map((i) => cur[i] ? `<i class="rn used" title="Na trava ${ARQS.find((q) => q.id === cur[i])!.name}"><svg viewBox="0 0 24 24">${GLYPH[s.tipo]}</svg></i>` : `<i class="rn" draggable="true" data-rune="g:${s.id}" title="Arraste para uma trava"><svg viewBox="0 0 24 24">${GLYPH[s.tipo]}</svg></i>`).join('')}</span>` : ''}</div>`; }).join('')}</div>`).join('')}</div></div>`; }
  function panelClick(t: HTMLElement, again: () => void): boolean { const b = t.closest('[data-gpapel]') as HTMLElement | null; if (!b) return false; const p = b.dataset.gpapel as Arq; setPapel(papel === p ? null : p); again(); return true; }
  /** as habilidades de grupo aprendidas, no formato que as travas esperam */
  const forLocks = () => known().map((s) => ({ k: 'g:' + s.id, name: s.name, svg: runaPedra(s, 22), c: COL[s.tipo] }));
  renderBar();
  return { cast, known, learned, panelHtml, panelClick, forLocks, renderBar, get papel() { return papel; }, total, testToggle() { testAll = !testAll; try { localStorage.setItem('karmika.grupoteste', testAll ? '1' : '0'); } catch { /* */ } barKey = ''; renderBar(); return testAll; } };
}
