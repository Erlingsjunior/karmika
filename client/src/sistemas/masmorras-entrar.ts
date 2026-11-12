/* MASMORRAS, CAVERNAS E SUBSOLOS: entrar e sair, os andares, os chefes e o mapa de cada uma (masmorras.ts monta, dungeon3d.ts desenha). Saiu do main.ts (02/11). */
import { createMasmorras, DG_TIERS } from '../masmorras';
import { TILE_M as T } from '@karmika/shared';
import { heightAt, regionAt, groundH } from '../world';
import { fine } from '../dual3d';
import { enemyHooks } from '../enemies';
import { dressEnemy, bossBody, kitOf, createBossBrain } from '../chefes';
import { IS_DEV } from '../premium';
import { confirmBox } from '../windows';
import * as THREE from 'three';
import { createCharacter } from '../characters';
import { type Choice } from '../dialog';
import { buildDwarfHall } from '../salao3d';
import { buildCanopyHall } from '../copa3d';
import { addHonor, HONOR_FOR } from './honra';
import type { MasmorrasEntrarCtx } from '../main';

export function createMasmorrasEntrar(K: MasmorrasEntrarCtx) {
/* ---------- masmorras, cavernas e subsolos (masmorras.ts + dungeon3d.ts) ---------- */
const dgs = createMasmorras({ scene: K.scene, T, city: K.city as never, heightAt, regionLvl: (x, y) => { const r = regionAt(x, y); return [r.lo, r.hi]; }, game: K.game as never, particles: K.particles, audio: K.audio as never,
  heroPos: () => K.heroPosNow(), project: (p) => { const v = p.clone().project(K.camera); if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) return null; const r = K.canvas.getBoundingClientRect(); return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height }; }, partySize: () => K.netRef?.party ? K.netRef.party.members.length : 1, partyLvl: () => { const P = K.netRef?.party; if (!P) return K.game.st.lvl; const ls = P.members.map((id) => id === K.netRef!.myId ? K.game.st.lvl : K.netRef!.infoOf(id)?.lvl ?? K.game.st.lvl); return ls.reduce((a, b) => a + b, 0) / Math.max(1, ls.length); }, say: (t) => K.chat.sys(t), fine,
  onKit: (e) => brain.track(e as never), onStop: () => brain.untrackAll(), descend: (depth, tier) => { const R = dgs.run, en = R && dgs.entrances.find((q) => q.d.id === R.d.id); if (en) enterDungeon(en, tier, depth); },
  bossChest: (x, z, y, items, gold) => K.bossChest(x, z, y, items, gold),
  onClear: (d, first) => { K.quests.onDungeon(d.id); K.feats.bump('dungeons'); addHonor(d.kind === 'grupo' ? HONOR_FOR.raid : HONOR_FOR.dungeon + HONOR_FOR.boss, `${d.name} vencida`); /* 08/11 Honra Kármica */ if (first && d.kind === 'grupo') K.heroicAct(`${d.name} vencida pela primeira vez`); if (first && d.title && K.profile) { K.profile.title = d.title; localStorage.setItem('karmika.char.v1', JSON.stringify(K.profile)); K.updateWho(); K.game.logMsg(`🏅 Título: ${d.title}`, '#ffe08a'); } K.netRef?.x('x:dgwin', { id: d.id }); } });
/* chefes e elites com história (chefes.ts): roupa ao montar o corpo, magias e jeito de andar */
enemyHooks.spark = (x, y, z, col) => { if (Math.random() > K.opts.particles) return; K.particles.spawn(x + (Math.random() - 0.5) * 0.2, y, z + (Math.random() - 0.5) * 0.2, { vx: (Math.random() - 0.5) * 0.3, vy: -0.2 - Math.random() * 0.3, vz: (Math.random() - 0.5) * 0.3, life: 0.6 + Math.random() * 0.4, s0: 0.07, s1: 0.01, c0: 0xffffff, c1: col, a: 0.9 }); };
enemyHooks.dress = (e, g) => dressEnemy(e as never, g); enemyHooks.body = (e) => bossBody(e as never) as never;
/* 26/10: os bichos do mundo com kit (a safra nova, os elites) também conjuram — o cérebro cuida deles quando o corpo aparece */
(window as unknown as { __fx?: unknown }).__fx = () => { const h = K.heroPosNow(); brain.demo(h.x + 2, groundH(K.state.fx * T, K.state.fy * T) + 0.07, h.z + 1); }; /* teste */
enemyHooks.track = (e) => { const k = kitOf(e.def.name); if (k) brain.track(e as never); /* 10/11: chefe sem magia também reage quando é encurralado */ }; enemyHooks.karma = () => K.state.karma;
let heroSlowK = 1, heroSlowUntil = 0, heroCharmUntil = 0;
const brain = createBossBrain({ scene: K.scene, fine: (o) => o, particles: K.particles, heroPos: () => K.heroPosNow().setY(groundH(K.state.fx * T, K.state.fy * T)), heroDead: () => K.game.st.dead,
  damage: (n, from) => K.game.damage(n, K.heroPosNow(), from), say: (t) => K.game.logMsg(t, '#ffb08a'), log: (t, c) => K.game.logMsg(t, c), shake: (k) => { K.game.st.shake = Math.max(K.game.st.shake, k); },
  slowHero: (k, secs) => { heroSlowK = k; heroSlowUntil = performance.now() + secs * 1000; (K.game.st as unknown as { slowUntil?: number }).slowUntil = heroSlowUntil; /* aparece nos debuffs */ }, pushHero: (dx, dz) => K.moveSlide(dx / T, dz / T, 0, false), charm: (sec) => { heroCharmUntil = performance.now() + sec * 1000; (K.game.st as unknown as { charmUntil?: number }).charmUntil = heroCharmUntil; },
  walkable: (x, z) => K.free(x / T, z / T), spawnAdd: (type, x, z) => { if (K.game.enemies.list.filter((q) => (q as { tag?: string }).tag === 'dg-add' && q.alive).length >= 45) return; /* a ninhada é sem fim, mas a tela não: no máximo 45 crias vivas */ K.game.enemies.spawn(type, x, z, { tag: 'dg-add', lvl: Math.max(1, (type === 'spiderling' ? K.game.st.lvl - 4 : K.game.st.lvl + 1)), aggro: 30, leash: 999 }); },
  sound: (k) => { if (k === 'boom') K.audio.boom(); else K.audio.spell(k); } });
if (IS_DEV) (window as unknown as { __brain: unknown }).__brain = brain;
function dgInst() { const p = K.netRef?.party; return p && p.members.length > 1 ? 'g' + Math.min(...p.members) : 's' + (K.netRef?.myId ?? 0); } // o grupo inteiro cai na mesma cópia
/** a placa da masmorra (25/10): mostra as dificuldades, os níveis e os prêmios; a masmorra acompanha o seu nível, mas você pode pedir mais */
/** a placa da estrada, lida de perto: cada tábua com o nome, a direção (rosa dos ventos) e a distância a pé */
function readSign(sg: (typeof K.city.signs)[number]) {
  const DIRS = ['Sul', 'Sudeste', 'Leste', 'Nordeste', 'Norte', 'Noroeste', 'Oeste', 'Sudoeste'], ARW = ['↓', '↘', '→', '↗', '↑', '↖', '←', '↙'];
  const rows = sg.lines.map((ln) => { const k = ((Math.round(ln.dir / (Math.PI / 4)) % 8) + 8) % 8; const tgt = K.city.settlements.find((q) => q.name === ln.text) ?? K.city.pois.find((q) => q.name === ln.text); const dist = tgt ? Math.round(Math.hypot(tgt.x - sg.x, tgt.y - sg.y) * T) : 0;
    return `<div class="sgrow"><span class="sgarw">${ARW[k]}</span><b>${ln.text}</b><small>${DIRS[k]}${dist ? ` · ${dist >= 1000 ? (dist / 1000).toFixed(1).replace('.', ',') + ' km' : dist + ' m'}` : ''}</small></div>`; }).join('');
  confirmBox(`<div class="sgread"><div class="sgtit">🪧 Placa da estrada</div>${rows}<p class="sgnote">As setas seguem o norte do mapa (M).</p></div>`, 'Seguir viagem', () => {}); }
function dungeonBoard(en: (typeof dgs.entrances)[number]) {
  const avg = Math.max(1, Math.round(K.game.st.lvl)), base = Math.max(1, avg - 1), seen = +(localStorage.getItem('karmika.dg.' + en.d.id) || 0);
  const rows = DG_TIERS.map((t, i) => ({ kind: 'custom' as const, label: `${t.name} · nível ${base + t.lv}–${avg + 2 + t.lv}`, hint: `XP ×${t.xp} · 🪙 ×${t.gold} · baú ${t.min === 'epic' ? 'épico+' : 'raro+'}${t.extra ? ` · +${t.extra} peça` : ''}`, cb: () => { K.dlg.close(); if (i >= 3) K.game.logMsg(`⚠ ${t.name}: os bichos vêm ${t.lv} níveis acima de você. Boa sorte.`, t.col); enterDungeon(en, i); } }));
  K.openDlg({ name: en.d.name, role: `${en.d.kind === 'grupo' ? 'Masmorra' : en.d.kind === 'subsolo' ? 'Subsolo' : 'Caverna'} · ${en.d.players}`, portrait: null,
    text: `Entalhado na tábua: “Quem desce volta mudado.”\n\nA masmorra acompanha o seu nível (${base}–${avg + 2}). Se quiser, peça mais: Difícil +4 níveis, Desafiador +8, Impossível +14 e Coisa de Doido +22. Quanto mais alto, mais fortes os bichos e mais rico o baú do chefe (e mais chance da peça única).${seen ? `\n\nVocê já venceu esta masmorra ${seen}×.` : ''}`,
    choices: [...rows, { kind: 'custom' as const, label: 'Agora não.', hint: '', cb: () => K.dlg.close() }], onAccept: () => {}, onTurnIn: () => {} });
}
/* a placa da masmorra é sólida: dois postes e a tábua (antes se atravessava) */
for (const en of dgs.entrances) { if (en.d.fixed) continue; const big = en.d.kind === 'grupo' ? 1.35 : 1; en.root.updateMatrixWorld(true);
  for (const lx of [-1.6, -0.8, 0, 0.8, 1.6]) { const v = new THREE.Vector3(-3.9 * big - 0.4 + Math.cos(0.18) * lx, 0, 3.6 * big - Math.sin(0.18) * lx); en.root.localToWorld(v); const c = { x: v.x / T, y: v.z / T, r: 0.22 };
    for (let ty = Math.floor(c.y - 0.6); ty <= Math.floor(c.y + 0.6); ty++) for (let tx = Math.floor(c.x - 0.6); tx <= Math.floor(c.x + 0.6); tx++) { const k = ty * 4096 + tx; const l = K.solids.get(k); if (l) l.push(c); else K.solids.set(k, [c]); } } }
function enterDungeon(en: (typeof dgs.entrances)[number], tier = 0, depth = 0) {
  K.withFade(() => {
    if (K.inside) { if (K.inside.dg) dgs.stop(); K.scene.remove(K.inside.int.group); }
    const int = dgs.build(en.d, depth); int.group.position.set(K.IX, 0, K.IZ); K.scene.add(int.group);
    K.inside = { int, ret: { x: en.x, y: en.y + 2.4 }, prop: { kind: 'dungeon', gx: en.x, gy: en.y, w: 1, h: 1, height: 1, wall: 0, roof: 0 } as unknown as (typeof K.city.props)[number], dg: en.d.id };
    K.objs.group.visible = false; K.casteloSys.sitting = null; for (const n of K.npcSys.npcs) n.hero.root.visible = false;
    K.state.fx = (K.IX + int.W / 2) / T; K.state.fy = (K.IZ + int.D - 1.6) / T; K.state.path = []; K.heroY = 0; K.camX = K.IX + int.W / 2; K.camZ = K.IZ + int.D - 8; K.camY = 0;
    dgs.start(en, int as never, { x: K.IX, z: K.IZ }, dgInst(), tier, depth); K.feats.bump('dgenter');
    K.netRef?.x('x:dgin', { id: en.d.id, inst: dgInst() });
  }, depth ? `Descendo ao nível ${depth + 1}: ${en.d.name}…` : `Descendo: ${en.d.name}…`);
}
/* os mausoléus das criptas são prédios: o herói não atravessa (fica livre só a frente, onde está a porta) */
for (const en of dgs.entrances) { if (en.d.theme !== 'cripta') continue; const big = en.d.kind === 'grupo' ? 1.35 : 1, cx = en.x, cy = en.y - 0.45, r = 0.95 * big;
  for (const [ox, oy] of [[-0.6 * big, -0.3 * big], [0.6 * big, -0.3 * big], [0, -0.7 * big]]) { const c = { x: cx + ox, y: cy + oy, r }; for (let ty = Math.floor(c.y - r - 0.3); ty <= Math.floor(c.y + r + 0.3); ty++) for (let tx = Math.floor(c.x - r - 0.3); tx <= Math.floor(c.x + r + 0.3); tx++) { const k = ty * 4096 + tx; const l = K.solids.get(k); if (l) l.push(c); else K.solids.set(k, [c]); } } }
(window as unknown as { __dg?: unknown }).__dg = { dgs, enterDungeon, city: K.city };
(window as unknown as { __cryptInt?: unknown }).__cryptInt = () => K.cryptInt;
(window as unknown as { __marks?: unknown }).__marks = () => K.CINE_MARKS;
(window as unknown as { __crypt?: unknown }).__crypt = (f: number) => { const p = K.city.props.find((q) => q.kind === 'church' && q.variant === 2); if (p) K.enterCrypt(f, p); };
/* Irmã Ysolde: espírito acorrentado na nave da Catedral — dá a missão interna e a encerra */
let spirit: { root: THREE.Object3D; x: number; z: number; where: string } | null = null;
/** onde a Irmã Ysolde deve estar agora: na porta da Catedral (lado de fora) ou logo na entrada da nave (andar 1) */
function spiritSpot(): { where: string; x: number; z: number; y: number; ry: number } | null {
  if (K.quests.q.done.includes('c01')) return null;
  if (K.inside) { if (K.inside.crypt !== 1) return null; const int = K.inside.int; return { where: 'nave', x: K.IX + int.W / 2 + 5.5, z: K.IZ + int.D - 6, y: 0.35, ry: Math.PI * 0.85 }; }
  const p = K.city.props.find((q) => q.kind === 'church' && q.variant === 2); if (!p) return null;
  const x = (p.gx + p.w / 2 + 0.8) * T + 3.6, z = (p.gy + p.h) * T + 5.2; if (Math.hypot(x - K.state.fx * T, z - K.state.fy * T) > 70) return null;
  return { where: 'porta', x, z, y: heightAt(x, z) + 0.35, ry: -0.5 };
}
function spawnSpirit(at: NonNullable<ReturnType<typeof spiritSpot>>) {
  const ch = createCharacter('nordic', { civil: 'human', cloth: 0x8ab0ff, hair: 0xe8e0ff, skin: 0xdcd8f0, hairStyle: 'long', static: true });
  ch.root.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; const mats = Array.isArray(m.material) ? m.material : [m.material]; for (const mt of mats) { const t = mt as THREE.MeshToonMaterial; t.transparent = true; t.opacity = 0.82; if (t.color) t.color.lerp(new THREE.Color(0xa8c4ff), 0.55); if (t.emissive) t.emissive.setHex(0x3a5ab0); } });
  ch.root.position.set(at.x, at.y, at.z); ch.root.rotation.y = at.ry; K.scene.add(fine(ch.root));
  const lamp = new THREE.PointLight(0x8ab0ff, 2.2, 12); lamp.position.set(0, 1.5, 0); ch.root.add(lamp);
  // correntes espectrais presas ao chão
  const cm = new THREE.MeshBasicMaterial({ color: 0x9ab8ff, transparent: true, opacity: 0.5, depthWrite: false });
  for (const s2 of [-1, 1]) for (let k = 0; k < 7; k++) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 4, 8), cm); l.position.set(s2 * (0.25 + k * 0.16), 0.9 - k * 0.15, 0.05); l.rotation.set(k % 2 ? Math.PI / 2 : 0, 0, 0.6 * s2); l.userData.xray = true; ch.root.add(l); }
  spirit = { root: ch.root, x: at.x, z: at.z, where: at.where };
}
function updateSpirit(dt: number, t: number) {
  const at = spiritSpot();
  if (spirit && (!at || at.where !== spirit.where)) { K.scene.remove(spirit.root); spirit = null; }
  if (!spirit && at) spawnSpirit(at);
  if (!spirit || !at) return;
  spirit.root.position.y = at.y + Math.sin(t * 1.3) * 0.12;
  if (Math.random() < dt * 8) K.particles.spawn(spirit.x + (Math.random() - 0.5) * 1.2, at.y - 0.15 + Math.random() * 1.8, spirit.z + (Math.random() - 0.5) * 1.2, { vy: 0.5, life: 1.4, s0: 0.12, s1: 0.02, c0: 0xffffff, c1: 0x6a8aff, a: 0.9 });
}
function talkSpirit() {
  const nm = 'Irmã Ysolde', ti = K.quests.turnins(nm), of = K.quests.offers(nm), choices: Choice[] = [];
  for (const d of ti) choices.push({ kind: 'turnin', label: `Entregar: ${d.name}`, hint: `${d.xp} XP · ${d.gold} 🪙`, quest: d });
  for (const d of of) choices.push({ kind: 'quest', label: d.name, hint: `Nv ${d.lvl}`, quest: d });
  choices.push({ kind: 'talk', label: 'Conversar', cb: () => K.dlg.setText(['As correntes não são de ferro. São de culpa — a minha e a dele.', 'Os selos estão nos carrascos que ele deixou nas criptas: o Carrasco, o Príncipe Ósseo, o Guardião.', 'Desça pela escada em espiral, no canto. Não olhe para o poço.'][Math.floor(Math.random() * 3)]) });
  choices.push({ kind: 'close', label: 'Até logo' });
  K.quests.onTalk(nm);
  let portrait: string | null = null; try { portrait = spirit ? K.portraitOf(nm, spirit.root) : null; } catch { portrait = null; }
  K.openDlg({ name: nm, role: 'Espírito aprisionado', portrait, text: ti.length ? 'Sinto as correntes afrouxarem… Acabou mesmo?' : of.length ? of[0].text : K.quests.q.active['c01'] ? 'Os mortos ainda andam. Os selos ainda dormem com seus carrascos. Vá.' : 'Obrigada. Agora posso descer de vez.', choices,
    onAccept: (d) => { K.quests.accept(d); K.game.logMsg('Irmã Ysolde: “Que a luz que ele apagou volte com você.”', '#b8c8ff'); },
    onTurnIn: (d) => { K.quests.turnIn(d); K.game.logMsg('Irmã Ysolde: “As correntes se partiram. Vá com o Olho.”', '#b8c8ff'); if (spirit) { for (let i = 0; i < 80; i++) K.particles.spawn(spirit.x, 0.5 + Math.random() * 2, spirit.z, { vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 3, vz: (Math.random() - 0.5) * 2, life: 2, s0: 0.2, s1: 0.02, c0: 0xffffff, c1: 0x8ab0ff, a: 1 }); K.scene.remove(spirit.root); spirit = null; } K.heroicAct('Irmã Ysolde libertada'); },
    objProg: (d, i) => K.quests.objProg(d, i), objNeed: (d, i) => K.quests.objNeed(d, i) });
}
const SEALS = ['seal_1', 'seal_2', 'seal_3'];
/** o Bispo em combate: sermões (anel de trevas que empurra e fere quem não desvia), invoca zumbis a 66% e 33%, enfurece a 20% */
function updateBishop(dt: number) {
  if (!K.bishop || !K.inside || K.inside.crypt !== 5) return;
  const b = K.bishop; if (!b.alive) { if (K.bishopPhase < 9) { K.bishopPhase = 9; K.game.enemies.clearTag('crypt-add'); } return; }
  const hpK = b.hp / b.hpMax;
  if (hpK < 0.66 && K.bishopPhase < 1) { K.bishopPhase = 1; K.chat.sys('O Bispo: "Levantai-vos, rebanho!" — zumbis saem das criptas.'); for (let i = 0; i < 4; i++) K.game.enemies.spawn('zombie', b.pos.x + (Math.random() - 0.5) * 8, b.pos.z + 3 + Math.random() * 5, { tag: 'crypt', hpMul: 1.2, dmgMul: 1.2, lvl: 20 }); }
  if (hpK < 0.33 && K.bishopPhase < 2) { K.bishopPhase = 2; K.chat.sys('O Bispo: "Gorvak, aceita este banquete!" — carniçais e um Príncipe respondem.'); for (let i = 0; i < 3; i++) K.game.enemies.spawn('ghoul', b.pos.x + (Math.random() - 0.5) * 8, b.pos.z + 3 + Math.random() * 5, { tag: 'crypt', hpMul: 1.3, dmgMul: 1.2, lvl: 22 }); K.game.enemies.spawn('prince', b.pos.x, b.pos.z + 6, { tag: 'crypt', name: 'Acólito Ósseo', hpMul: 1.2, dmgMul: 1.1, scale: 1.0, lvl: 24 }); }
  if (hpK < 0.2 && K.bishopPhase < 3) { K.bishopPhase = 3; b.def.dmg = Math.round(b.def.dmg * 1.5); b.def.speed *= 1.25; K.chat.sys('O Bispo sangra fumaça negra e se enfurece.'); }
  K.sermonT -= dt;
  if (K.sermonT <= 0) { K.sermonT = 7 - K.bishopPhase; const cx = b.pos.x, cz = b.pos.z; K.chat.sys('O Bispo entoa um Sermão das Trevas — saia do círculo!'); let t = 0; const R = 6.5;
    const ring = new THREE.Mesh(new THREE.RingGeometry(R - 0.3, R, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xb3202f, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); ring.position.set(cx, 0.08, cz); K.scene.add(fine(ring));
    const tick = () => { t += 1 / 60; ring.scale.setScalar(0.2 + t / 1.6 * 0.8); (ring.material as THREE.MeshBasicMaterial).opacity = 0.9 - t * 0.4; for (let i = 0; i < 4; i++) K.particles.spawn(cx + (Math.random() - 0.5) * 2 * R * ring.scale.x, 0.2, cz + (Math.random() - 0.5) * 2 * R * ring.scale.x, { vy: 1 + Math.random(), life: 0.6, s0: 0.3, s1: 0.05, c0: 0xff3a4a, c1: 0x3a0a10, a: 0.9 }); if (t < 1.6) requestAnimationFrame(tick); else { K.scene.remove(ring); const d = Math.hypot(K.state.fx * T - cx, K.state.fy * T - cz); if (d < R && !(K.hero.actName === 'dash')) { K.game.damage(Math.round(26 + K.bishopPhase * 8), K.hero.root.position); K.game.logMsg('✝ O Sermão das Trevas queima a sua alma.', '#ff9a8a'); } } };
    tick(); K.audio.spell('shock'); }
}
let exiting = false;
/* o Grande Salão de Brasaforja (27/10): a maravilha dos anões, por dentro dos Portões na Montanha Negra */
const HALL_GATE = K.city.props.find((p) => p.kind === 'monument' && p.variant === 9) ?? null;
function enterHall(p: (typeof K.city.props)[number]) {
  K.withFade(() => {
    const int = buildDwarfHall(p.gx * 31 + p.gy);
    int.group.position.set(K.IX, 0, K.IZ); K.scene.add(int.group);
    K.inside = { int, ret: { x: p.gx + p.w / 2 + 0.5, y: p.gy + 9.2 }, prop: p, hall: true };
    K.objs.group.visible = false; K.casteloSys.sitting = null; for (const n of K.npcSys.npcs) n.hero.root.visible = false;
    K.state.fx = (K.IX + int.W / 2) / T; K.state.fy = (K.IZ + int.D - 0.8) / T; K.state.path = [];
    K.heroY = 0; K.camX = K.IX + int.W / 2; K.camZ = K.IZ + int.D / 2; K.camY = 0;
    K.game.logMsg('⛏ O Grande Salão de Brasaforja: a montanha respira aqui dentro', '#ffb060');
  });
}
/* 09/11 A COPA DA ÁRVORE-MÃE (Lithendel): a Passagem da Raiz, ao sul do tronco, sobe para o salão dos elfos sobre os galhos (copa3d.ts) */
const TREE_GATE = K.city.props.find((p) => p.kind === 'monument' && p.variant === 11) ?? null;
function enterCanopy(p: (typeof K.city.props)[number]) {
  K.withFade(() => {
    const int = buildCanopyHall(p.gx * 17 + p.gy);
    int.group.position.set(K.IX, 0, K.IZ); K.scene.add(int.group);
    K.inside = { int, ret: { x: p.gx + p.w / 2 + 0.5, y: p.gy + p.h / 2 + 3.2 }, prop: p, hall: true, canopy: true };
    K.objs.group.visible = false; K.casteloSys.sitting = null; for (const n of K.npcSys.npcs) n.hero.root.visible = false;
    K.state.fx = (K.IX + int.W / 2) / T; K.state.fy = (K.IZ + int.D / 2 + 17) / T; K.state.path = [];
    K.heroY = 0; K.camX = K.IX + int.W / 2; K.camZ = K.IZ + int.D / 2; K.camY = 0;
    K.game.logMsg('❦ A Copa da Árvore-Mãe: o vento canta entre as folhas, e a Rainha espera', '#9ad8ff');
  });
}
  return { dgs, dgInst, get heroSlowUntil() { return heroSlowUntil; }, get heroSlowK() { return heroSlowK; }, get heroCharmUntil() { return heroCharmUntil; }, get exiting() { return exiting; }, set exiting(v: typeof exiting) { exiting = v; }, get spirit() { return spirit; }, set spirit(v: typeof spirit) { spirit = v; }, enterDungeon, dungeonBoard, readSign, talkSpirit, SEALS, HALL_GATE, enterHall, TREE_GATE, enterCanopy, updateBishop, updateSpirit, brain };
}
