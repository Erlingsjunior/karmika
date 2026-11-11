/* ESPÓLIO DO ELITE (10/11, Erling: "matou um elite tem que aparecer um baú top de ouro com itens para o jogador solo ou o grupo;
   quando um item aparece eu escolho ficar ou passar; se mais de uma pessoa quiser, aparece a disputa no meio da tela, os dados
   de todos que disputam são lançados, todos do grupo veem, quem tirar o maior número fica com o item").

   - Elite morto → um baú dourado nasce onde ele caiu (o chefe da masmorra NÃO entra aqui: o espólio dele é de cada um).
   - Sozinho: abre e leva tudo.
   - Em grupo: quem matou sorteia o conteúdo e manda para o grupo (x:bau). Qualquer um abre (x:bauAbrir). O ouro é dividido.
     Cada item vai ao meio da tela com "Quero" e "Passo" (20 s; quem não responde, passa). Um só quis: leva. Mais de um: um d20 para
     cada, na tela de todos; o maior leva, empate rola de novo. Ninguém quis: o item é vendido e o ouro dividido.
   Quem matou é quem apura os votos e rola os dados (x:bauItem, x:bauVoto, x:bauRes). O servidor só repassa. */
import * as THREE from 'three';
import { genGear, rollRarity, gearTip, gearIcon, RARITY, syncUid, type Gear, type Rarity } from '../loot';

export interface EspolioCtx {
  scene: THREE.Scene; fine(o: THREE.Object3D): THREE.Object3D;
  particles: { spawn(x: number, y: number, z: number, o: Record<string, number>): void };
  audio: { chime(): void; coins(n: number): void; boom(): void; click(): void };
  heroPos(): THREE.Vector3; /** onde eu estou: 'w' no mundo, ou a masmorra/casa */ zone(): string; myName(): string;
  net(): { state: string; myId: number; party: { members: number[] } | null; x(t: string, d: object): void; onX(t: string, f: (from: number, m: Record<string, unknown>) => void): void; nameOf(id: number): string } | null;
  log(t: string, c?: string): void; addGold(n: number): void; giveGear(x: number, z: number, y: number, gs: Gear[]): void;
}
interface Chest { k: string; x: number; y: number; z: number; zn: string; items: Gear[]; gold: number; mem: number[]; auth: number; g: THREE.Group; t: number; open: boolean; born: number }
const ORDER: Rarity[] = ['normal', 'magic', 'rare', 'legendary', 'epic', 'unique', 'relic'];
const d20 = () => 1 + Math.floor(Math.random() * 20);

export function createEspolio(ctx: EspolioCtx) {
  const chests = new Map<string, Chest>();
  let bound = false;
  const me = () => ctx.net()?.myId ?? 0;
  const group = () => { const n = ctx.net(); return n && n.state === 'on' && n.party && n.party.members.length > 1 ? n.party.members : null; };

  /* ---------- o baú dourado ---------- */
  function mesh(): THREE.Group {
    const g = new THREE.Group(), gold = new THREE.MeshBasicMaterial({ color: 0xffd060 }), wood = new THREE.MeshLambertMaterial({ color: 0x7a4a1c, emissive: 0x2a1404 }), dark = new THREE.MeshLambertMaterial({ color: 0x4a2a10 });
    const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, p: THREE.Object3D = g) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; p.add(o); return o; };
    box(1.1, 0.55, 0.7, wood, 0, 0.3, 0); box(1.16, 0.08, 0.76, gold, 0, 0.06, 0); box(1.16, 0.08, 0.76, gold, 0, 0.56, 0);
    for (const sx of [-0.42, 0.42]) box(0.1, 0.56, 0.78, gold, sx, 0.3, 0);
    const lid = new THREE.Group(); lid.position.set(0, 0.6, -0.35); g.add(lid); g.userData.lid = lid;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.1, 14, 1, false, 0, Math.PI), dark); top.rotation.z = Math.PI / 2; top.position.set(0, 0, 0.35); top.castShadow = true; lid.add(top);
    for (const sx of [-0.42, 0, 0.42]) { const band = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.1, 14, 1, false, 0, Math.PI), gold); band.rotation.z = Math.PI / 2; band.position.set(sx, 0, 0.35); lid.add(band); }
    box(0.16, 0.2, 0.06, gold, 0, 0.42, 0.37);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.75, 7, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd870, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); beam.position.y = 3.6; g.add(beam); g.userData.beam = beam;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); ring.position.y = 0.04; g.add(ring); g.userData.ring = ring;
    g.traverse((o) => { o.userData.dyn = true; });
    return g;
  }
  function addChest(c: Omit<Chest, 'g' | 't' | 'open' | 'born'>) {
    if (chests.has(c.k)) return; for (const it of c.items) syncUid(it.uid);
    const g = mesh(); g.position.set(c.x, c.y, c.z); g.scale.setScalar(0.01); ctx.scene.add(ctx.fine(g));
    chests.set(c.k, { ...c, g, t: 0, open: false, born: performance.now() });
    ctx.audio.chime(); for (let i = 0; i < 40; i++) { const a = Math.random() * 6.283, s = 1 + Math.random() * 3; ctx.particles.spawn(c.x, c.y + 0.4, c.z, { vx: Math.cos(a) * s, vy: 2 + Math.random() * 4, vz: Math.sin(a) * s, life: 1, s0: 0.22, s1: 0.03, c0: 0xfff0a0, c1: 0xffa020, a: 1, drag: 1.4 }); }
    ctx.log(c.mem.length > 1 ? '✦ Um baú dourado ficou no lugar do elite: abram, o espólio é do grupo.' : '✦ Um baú dourado ficou no lugar do elite. Abra: é seu.', '#ffd870');
  }
  function drop(k: string) { const c = chests.get(k); if (!c) return; ctx.scene.remove(c.g); c.g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); } }); chests.delete(k); }

  /** elite morto. Devolve true quando o baú cuida do espólio (o jogo então não solta as peças direto no chão) */
  function eliteDied(e: { pos: THREE.Vector3; def: { name: string } }, ilvl: number, boost: Partial<Record<Rarity, number>>, shared: boolean): boolean {
    const mem = group(); if (shared) return !!mem; /* a morte veio de um companheiro: o baú chega pela rede, de quem matou */
    const n = 2 + (mem ? 1 : 0) + (Math.random() < 0.4 ? 1 : 0), items: Gear[] = [];
    for (let i = 0; i < n; i++) { let g = genGear(ilvl, rollRarity({ ...boost, rare: (boost.rare ?? 1) * 3, legendary: (boost.legendary ?? 1) * 3, epic: (boost.epic ?? 1) * 2 })); if (ORDER.indexOf(g.rarity) < 2) g = genGear(ilvl, 'rare', g.slot); items.push(g); }
    const c = { k: `${me()}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`, x: e.pos.x, y: e.pos.y, z: e.pos.z, zn: ctx.zone(), items, gold: (18 + ilvl * 7) * (mem ? mem.length : 1), mem: mem ? [...mem] : [me()], auth: me() };
    addChest(c); if (mem) ctx.net()!.x('x:bau', { k: c.k, x: c.x, y: c.y, z: c.z, zn: c.zn, items: c.items, gold: c.gold, mem: c.mem });
    return true;
  }

  /* ---------- abrir ---------- */
  function openChest(c: Chest, by: number) {
    if (c.open) return; c.open = true; c.t = 0; ctx.audio.coins(3); ctx.audio.boom();
    for (let i = 0; i < 70; i++) { const a = Math.random() * 6.283, s = 1 + Math.random() * 4; ctx.particles.spawn(c.x, c.y + 0.7, c.z, { vx: Math.cos(a) * s, vy: 3 + Math.random() * 5, vz: Math.sin(a) * s, life: 1.2, s0: 0.25, s1: 0.03, c0: 0xfff0a0, c1: 0xffa020, a: 1, drag: 1.3 }); }
    const share = Math.max(1, Math.round(c.gold / c.mem.length)); ctx.addGold(share);
    if (c.mem.length <= 1) { ctx.log(`✦ Baú dourado: ${share} de ouro e ${c.items.length} peças.`, '#ffd870'); ctx.giveGear(c.x, c.z, c.y, c.items); setTimeout(() => drop(c.k), 2600); return; }
    ctx.log(`✦ ${by === me() ? 'Você abriu' : (ctx.net()?.nameOf(by) ?? 'Alguém') + ' abriu'} o baú dourado: ${share} de ouro para cada um. Agora, as peças.`, '#ffd870');
    if (c.auth === me()) setTimeout(() => nextItem(c, 0), 1400);
    setTimeout(() => drop(c.k), 2600);
  }
  /** o E perto do baú */
  function interact(hx: number, hz: number): { d: number; label: string; act: () => void } | null {
    let best: Chest | null = null, bd = 3.2; const zn = ctx.zone();
    for (const c of chests.values()) { if (c.open || c.zn !== zn) continue; const d = Math.hypot(c.x - hx, c.z - hz); if (d < bd) { bd = d; best = c; } }
    if (!best) return null; const c = best;
    return { d: bd, label: 'E — Abrir o baú dourado', act: () => { if (c.mem.length > 1) ctx.net()?.x('x:bauAbrir', { k: c.k }); openChest(c, me()); } };
  }

  /* ---------- a disputa (quem matou apura) ---------- */
  const pend = new Map<string, { c: Pick<Chest, 'k' | 'items' | 'mem' | 'x' | 'y' | 'z'>; i: number; votes: Map<number, boolean>; timer: number }>();
  const kept = new Map<string, Pick<Chest, 'k' | 'items' | 'mem' | 'x' | 'y' | 'z' | 'auth'>>(); /* o baú some da tela, mas a disputa ainda precisa das peças */
  function nextItem(c: Pick<Chest, 'k' | 'items' | 'mem' | 'x' | 'y' | 'z'>, i: number) {
    if (i >= c.items.length) { ctx.net()?.x('x:bauFim', { k: c.k }); endSession(c.k); return; }
    const p = { c, i, votes: new Map<number, boolean>(), timer: window.setTimeout(() => settle(c.k), 21000) }; pend.set(c.k, p);
    ctx.net()?.x('x:bauItem', { k: c.k, i }); showVote(c.k, i);
  }
  function vote(k: string, i: number, from: number, want: boolean) { markVote(k, i, from, want); const p = pend.get(k); if (!p || p.i !== i || !p.c.mem.includes(from)) return; p.votes.set(from, want); if (p.c.mem.every((id) => p.votes.has(id))) settle(k); }
  function settle(k: string) {
    const p = pend.get(k); if (!p) return; pend.delete(k); clearTimeout(p.timer);
    let want = p.c.mem.filter((id) => p.votes.get(id) === true); const rounds: [number, number][][] = []; let win = 0;
    if (want.length === 1) win = want[0];
    else if (want.length > 1) for (let r = 0; r < 6 && !win; r++) { const roll = want.map((id) => [id, d20()] as [number, number]); rounds.push(roll); const top = Math.max(...roll.map((q) => q[1])), tops = roll.filter((q) => q[1] === top).map((q) => q[0]); if (tops.length === 1 || r === 5) win = tops[0]; else want = tops; }
    const m = { k, i: p.i, rounds, win }; ctx.net()?.x('x:bauRes', m); result(k, p.i, rounds, win);
    setTimeout(() => nextItem(p.c, p.i + 1), 2200 + rounds.length * 2600);
  }

  /* ---------- a tela ---------- */
  let ui: HTMLElement | null = null, uiK = '', uiI = -1, uiT = 0, uiBar = 0;
  function el() {
    if (ui) return ui;
    const st = document.createElement('style'); st.textContent = `
      #espolio { position: fixed; left: 50%; top: 46%; transform: translate(-50%, -50%); z-index: 60; width: min(560px, 92vw); padding: 18px 22px 16px; background: linear-gradient(180deg, rgba(34,24,14,.97), rgba(16,11,8,.97)); border: 1px solid #b8924a; border-radius: 8px; box-shadow: 0 0 0 1px #2a1c0e, 0 18px 60px rgba(0,0,0,.75), 0 0 46px rgba(255,200,90,.16); color: #e8dcc0; font: 15px Georgia, serif; text-align: center; }
      #espolio h4 { margin: 0 0 10px; font: 600 12px Cinzel, Georgia, serif; letter-spacing: .26em; text-transform: uppercase; color: #d9a24f; }
      #espolio .it { display: flex; gap: 14px; align-items: flex-start; text-align: left; background: rgba(0,0,0,.32); border: 1px solid #4a3a24; border-radius: 6px; padding: 12px; }
      #espolio .it .ic { flex: 0 0 64px; width: 64px; height: 64px; display: grid; place-items: center; font-size: 40px; border: 1px solid var(--rc, #b8924a); border-radius: 6px; background: rgba(0,0,0,.4); box-shadow: 0 0 16px color-mix(in srgb, var(--rc, #b8924a) 45%, transparent); }
      #espolio .it .ic img { max-width: 56px; max-height: 56px; }
      #espolio .it .tx { font-size: 13px; line-height: 1.35; max-height: 190px; overflow: auto; }
      #espolio .it .tx b { font-size: 15px; } #espolio .it .tx small b { font-size: inherit; } #espolio .it .tx small { color: #a89878; font-size: 11px; display: inline; } #espolio .it .tx hr { border: 0; border-top: 1px solid #4a3c28; margin: 6px 0; } #espolio .it .tx .at { color: #9ad7ff; } #espolio .it .tx * { position: static !important; float: none !important; } #espolio .it .tx span { font-size: 13px !important; line-height: 1.4 !important; }
      #espolio .bt { display: flex; gap: 12px; justify-content: center; margin-top: 14px; }
      #espolio button { font: 600 15px Georgia, serif; padding: 9px 26px; border-radius: 5px; cursor: pointer; border: 1px solid #b8924a; background: linear-gradient(180deg, #6a4a1c, #3a2810); color: #ffe9b0; }
      #espolio button.no { border-color: #5a4a36; background: rgba(0,0,0,.35); color: #b4a68e; }
      #espolio button:hover { filter: brightness(1.2); } #espolio button:disabled { opacity: .45; cursor: default; filter: none; }
      #espolio .bar { height: 3px; background: #3a2c1a; border-radius: 2px; margin-top: 12px; overflow: hidden; } #espolio .bar i { display: block; height: 100%; background: #d9a24f; width: 100%; }
      #espolio .who { display: flex; flex-wrap: wrap; gap: 6px 10px; justify-content: center; margin-top: 10px; font-size: 13px; color: #b4a68e; } #espolio .who b { color: #ffe9b0; font-weight: 600; } #espolio .who .n { color: #7a6c58; text-decoration: line-through; }
      #espolio .dice { display: flex; flex-wrap: wrap; gap: 18px; justify-content: center; margin: 16px 0 4px; }
      #espolio .die { display: grid; justify-items: center; gap: 6px; font-size: 13px; color: #cbbd9c; }
      #espolio .die u { text-decoration: none; display: grid; place-items: center; width: 74px; height: 74px; font: 700 30px Cinzel, Georgia, serif; color: #2a1806; background: radial-gradient(circle at 35% 30%, #fff3c0, #e0a83c 60%, #9a6a18); clip-path: polygon(50% 0, 97% 26%, 97% 74%, 50% 100%, 3% 74%, 3% 26%); filter: drop-shadow(0 4px 8px rgba(0,0,0,.6)); }
      #espolio .die.roll u { animation: espRoll .12s linear infinite; } #espolio .die.win u { background: radial-gradient(circle at 35% 30%, #ffffff, #ffd24a 55%, #d08a10); box-shadow: 0 0 0 2px #fff; } #espolio .die.win { color: #ffe9b0; font-weight: 700; } #espolio .die.lose { opacity: .45; }
      #espolio .res { margin-top: 10px; font: 600 17px Georgia, serif; color: #ffe08a; min-height: 22px; }
      @keyframes espRoll { 0% { transform: rotate(-14deg) scale(1.06); } 50% { transform: rotate(12deg) scale(.96); } 100% { transform: rotate(-14deg) scale(1.06); } }`;
    document.head.appendChild(st);
    ui = document.createElement('div'); ui.id = 'espolio'; ui.hidden = true; document.body.appendChild(ui);
    ui.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('button[data-w]') as HTMLButtonElement | null; if (!b || b.disabled) return; const want = b.dataset.w === '1'; ctx.audio.click();
      ui!.querySelectorAll<HTMLButtonElement>('button[data-w]').forEach((x) => { x.disabled = true; }); const c = kept.get(uiK); if (!c) return;
      ctx.net()?.x('x:bauVoto', { k: uiK, i: uiI, w: want }); vote(uiK, uiI, me(), want); });
    ui.addEventListener('keydown', (e) => e.stopPropagation());
    return ui;
  }
  const nameOf = (id: number) => id === me() ? ctx.myName() : ctx.net()?.nameOf(id) ?? '?';
  const card = (g: Gear) => `<div class="it" style="--rc:${RARITY[g.rarity].col}"><div class="ic">${gearIcon(g)}</div><div class="tx">${gearTip(g)}</div></div>`;
  function showVote(k: string, i: number) {
    const c = kept.get(k); if (!c || !c.mem.includes(me())) return; const g = c.items[i]; if (!g) return; const u = el(); uiK = k; uiI = i; uiT = performance.now(); uiBar = 20000;
    u.innerHTML = `<h4>Espólio do grupo · peça ${i + 1} de ${c.items.length}</h4>${card(g)}<div class="bt"><button data-w="1">🎲 Quero</button><button class="no" data-w="0">Passo</button></div><div class="who">${c.mem.map((id) => `<span data-id="${id}">${nameOf(id)}</span>`).join('')}</div><div class="bar"><i></i></div>`;
    u.hidden = false; ctx.audio.chime();
  }
  function markVote(k: string, i: number, from: number, want: boolean) { if (!ui || uiK !== k || uiI !== i) return; const s = ui.querySelector(`.who [data-id="${from}"]`); if (s) { s.innerHTML = want ? `<b>🎲 ${nameOf(from)}</b>` : `<span class="n">${nameOf(from)}</span>`; } }
  function result(k: string, i: number, rounds: [number, number][][], win: number) {
    const c = kept.get(k); if (!c) return; const g = c.items[i]; if (!g) return; const mine = c.mem.includes(me()); const u = el(); uiK = k; uiI = i; uiBar = 0;
    const give = () => { if (win === me()) { ctx.giveGear(ctx.heroPos().x, ctx.heroPos().z, ctx.heroPos().y, [g]); ctx.audio.chime(); } else if (!win) { ctx.addGold(Math.max(1, Math.round((g.value || 10) / c.mem.length))); } };
    if (!mine) return;
    if (!rounds.length) { u.innerHTML = `<h4>Espólio do grupo · peça ${i + 1} de ${c.items.length}</h4>${card(g)}<div class="res">${win ? (win === me() ? 'É sua: só você quis.' : `${nameOf(win)} ficou com a peça.`) : 'Ninguém quis: vendida, e o ouro foi dividido.'}</div>`; u.hidden = false; give();
      ctx.log(win ? `🎲 ${nameOf(win)} ficou com ${g.name}.` : `🎲 Ninguém quis ${g.name}: vendida, ouro dividido.`, RARITY[g.rarity].col); return; }
    let r = 0; const play = () => { const roll = rounds[r], last = r === rounds.length - 1, top = Math.max(...roll.map((q) => q[1]));
      u.innerHTML = `<h4>Disputa de item${r ? ' · desempate' : ''}</h4>${card(g)}<div class="dice">${roll.map(([id]) => `<div class="die roll" data-id="${id}"><u>?</u><span>${nameOf(id)}</span></div>`).join('')}</div><div class="res"></div>`; u.hidden = false;
      const spin = window.setInterval(() => { u.querySelectorAll('.die.roll u').forEach((x) => { x.textContent = String(d20()); }); }, 70);
      setTimeout(() => { clearInterval(spin); for (const [id, n] of roll) { const d = u.querySelector(`.die[data-id="${id}"]`); if (!d) continue; d.classList.remove('roll'); d.querySelector('u')!.textContent = String(n); d.classList.add(n === top ? 'win' : 'lose'); } ctx.audio.boom();
        const res = u.querySelector('.res')!; if (!last) { res.textContent = 'Empate! Os dados rolam de novo.'; r++; setTimeout(play, 1100); }
        else { res.textContent = win === me() ? `Você tirou ${top}: a peça é sua!` : `${nameOf(win)} tirou ${top} e leva a peça.`; give(); ctx.log(`🎲 Disputa por ${g.name}: ${roll.map(([id, n]) => `${nameOf(id)} ${n}`).join(' · ')}. ${nameOf(win)} leva.`, RARITY[g.rarity].col); } }, 1500); };
    play();
  }
  function endSession(k: string) { kept.delete(k); if (uiK === k) setTimeout(() => { if (uiK === k && ui) { ui.hidden = true; uiK = ''; } }, 2600); }

  /* ---------- rede ---------- */
  function bind() {
    const n = ctx.net(); if (!n || bound) return; bound = true;
    const mate = (id: number) => !!n.party && n.party.members.includes(id) && id !== n.myId;
    n.onX('x:bau', (from, m) => { if (!mate(from) || String(m.zn) !== ctx.zone()) return; const x = +(m.x as number), z = +(m.z as number), h = ctx.heroPos(); if (Math.hypot(x - h.x, z - h.z) > 90) return; const mem = (m.mem as number[]) ?? []; if (!mem.includes(n.myId)) return;
      addChest({ k: String(m.k), x, y: +(m.y as number) || 0, z, zn: String(m.zn), items: (m.items as Gear[]) ?? [], gold: +(m.gold as number) || 0, mem, auth: from }); });
    n.onX('x:bauAbrir', (from, m) => { const c = chests.get(String(m.k)); if (c && mate(from)) openChest(c, from); });
    n.onX('x:bauItem', (from, m) => { const c = kept.get(String(m.k)); if (c && c.auth === from) showVote(c.k, +(m.i as number)); });
    n.onX('x:bauVoto', (from, m) => { if (mate(from)) vote(String(m.k), +(m.i as number), from, !!m.w); });
    n.onX('x:bauRes', (from, m) => { const c = kept.get(String(m.k)); if (c && c.auth === from) result(c.k, +(m.i as number), (m.rounds as [number, number][][]) ?? [], +(m.win as number) || 0); });
    n.onX('x:bauFim', (from, m) => { const c = kept.get(String(m.k)); if (c && c.auth === from) endSession(c.k); });
  }

  function update(dt: number) {
    if (!bound) bind();
    const now = performance.now();
    for (const c of chests.values()) { c.t += dt; if (!kept.has(c.k)) kept.set(c.k, c);
      const g = c.g, lid = g.userData.lid as THREE.Group, beam = g.userData.beam as THREE.Mesh, ring = g.userData.ring as THREE.Mesh;
      if (!c.open) { const k = Math.min(1, c.t / 0.45), s = k < 1 ? 1.25 * k * (2 - k) * 0.82 : 1; g.scale.setScalar(Math.max(0.01, s)); g.position.y = c.y + (k < 1 ? Math.sin(k * Math.PI) * 0.6 : 0);
        (beam.material as THREE.MeshBasicMaterial).opacity = 0.13 + Math.sin(now * 0.004) * 0.05; ring.rotation.y += dt * 0.8; ring.scale.setScalar(1 + Math.sin(now * 0.005) * 0.08);
        if (Math.random() < dt * 9) { const a = Math.random() * 6.283, r = 0.3 + Math.random() * 0.7; ctx.particles.spawn(c.x + Math.cos(a) * r, c.y + 0.2, c.z + Math.sin(a) * r, { vy: 1 + Math.random() * 1.5, life: 1.1, s0: 0.1, s1: 0.02, c0: 0xfff0a0, c1: 0xffb030, a: 0.9 }); }
        if (now - c.born > 600000) drop(c.k); /* 10 min sem ninguém abrir: some */ }
      else { lid.rotation.x = -Math.min(1.9, c.t * 6); const f = Math.max(0, 1 - c.t / 2.4); (beam.material as THREE.MeshBasicMaterial).opacity = 0.4 * f; beam.scale.x = beam.scale.z = 1 + c.t; (ring.material as THREE.MeshBasicMaterial).opacity = 0.55 * f; if (c.t > 1.6) g.scale.setScalar(Math.max(0.01, 1 - (c.t - 1.6) / 0.9)); } }
    if (ui && !ui.hidden && uiBar) { const k = Math.max(0, 1 - (now - uiT) / uiBar), b = ui.querySelector('.bar i') as HTMLElement | null; if (b) b.style.width = (k * 100).toFixed(1) + '%'; }
    if (ui && !ui.hidden && now - uiT > 60000 && uiBar) { ui.hidden = true; uiK = ''; } /* quem apurava caiu: a tela não fica presa */
  }
  /** teste: um baú dourado ao lado do herói */
  function debug(n = 3) { const h = ctx.heroPos(); const items: Gear[] = []; for (let i = 0; i < n; i++) items.push(genGear(12, i ? 'rare' : 'epic')); addChest({ k: 'dbg' + Date.now(), x: h.x + 1.2, y: h.y, z: h.z + 1.6, zn: ctx.zone(), items, gold: 120, mem: [me()], auth: me() }); }
  return { eliteDied, interact, update, debug, _test: { nextItem, kept, showVote, result } };
}
