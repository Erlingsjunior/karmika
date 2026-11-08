/* EVENTOS VIVOS (eventos.ts): os lugares dos eventos, os efeitos (fogos, pétalas, incenso, velas), os painéis e o sistema de eventos. Saiu do main.ts (02/11). */
import { addHonor, HONOR_FOR } from './honra';
import { regionAt, MAP_W, heightAt } from '../world';
import { createEvents } from '../eventos';
import { type Reply } from '../dialog';
import type { EventosVivosCtx } from '../main';

export function createEventosVivos(K: EventosVivosCtx) {
/* ---------- Eventos vivos (eventos.ts, 24/10): patrulhas, rituais, romarias, festas, casamentos, vilas sitiadas — e os globais ---------- */
const evSites = (() => { const v: { x: number; y: number; name: string; region: number }[] = [], r: typeof v = [], f: typeof v = [];
  const nearTownT = (x: number, y: number, pad: number) => K.city.settlements.some((st) => Math.hypot(st.x - x, st.y - y) < st.radius + pad);
  for (const st of K.city.settlements) if (st.kind !== 'city' && st.radius >= 6) v.push({ x: Math.round(st.x), y: Math.round(st.y), name: st.name, region: regionAt(st.x, st.y).id });
  const nameNear = (x: number, y: number) => { let b = 'a estrada', bd = 1e9; for (const st of K.city.settlements) { const d = Math.hypot(st.x - x, st.y - y); if (d < bd) { bd = d; b = st.name; } } return b; };
  for (const rp of K.city.roadPaths) for (let i = 10; i < rp.length - 10; i += 28) { const q = rp[i]; if (nearTownT(q.x, q.y, 24)) continue; r.push({ x: Math.round(q.x), y: Math.round(q.y), name: `estrada perto de ${nameNear(q.x, q.y)}`, region: regionAt(q.x, q.y).id }); }
  for (let y = 20; y < MAP_W - 20; y += 13) for (let x = 20; x < MAP_W - 20; x += 13) { if (K.city.biome[y]?.[x] !== 'forest' || K.city.map[y]?.[x] !== 'grass' || nearTownT(x, y, 22)) continue; f.push({ x, y, name: `mata perto de ${nameNear(x, y)}`, region: regionAt(x, y).id }); }
  return { sitesVillage: v, sitesRoad: r, sitesForest: f, roadPaths: K.city.roadPaths }; })();
const evFx = (kind: 'firework' | 'petal' | 'holy' | 'dark' | 'smoke' | 'incense' | 'candle', x: number, y: number, z: number) => {
  if (kind === 'incense') { K.particles.spawn(x + (Math.random() - 0.5) * 0.05, y, z + (Math.random() - 0.5) * 0.05, { vx: (Math.random() - 0.5) * 0.15, vy: 0.55 + Math.random() * 0.3, vz: (Math.random() - 0.5) * 0.15, life: 2.6, s0: 0.12, s1: 0.55, c0: 0xd8d0c0, c1: 0x6a6460, a: 0.32, drag: 0.5, w: 0.5, flit: 0.6 }); return; }
  if (kind === 'candle') { K.particles.spawn(x, y, z, { vy: 0.25, life: 0.35, s0: 0.2, s1: 0.06, c0: 0xfff0a0, c1: 0xff8a20, a: 0.95 }); return; }
  if (kind === 'firework') { const c = [0xff5a4a, 0x5ab0ff, 0xffd24a, 0x9aff7a, 0xff8ad0][Math.floor(Math.random() * 5)]; for (let i = 0; i < 36; i++) { const a = Math.random() * 6.283, b = Math.random() * 3.14, sp = 5 + Math.random() * 3; K.particles.spawn(x, y, z, { vx: Math.cos(a) * Math.sin(b) * sp, vy: Math.cos(b) * sp, vz: Math.sin(a) * Math.sin(b) * sp, life: 1.6, s0: 0.5, s1: 0.15, c0: c, c1: 0x401808, a: 1, drag: 1.2, g: -3 }); } K.audio.click?.(); return; }
  if (kind === 'petal') { K.particles.spawn(x, y, z, { vx: (Math.random() - 0.5) * 0.6, vy: -0.5, vz: (Math.random() - 0.5) * 0.6, life: 4, s0: 0.22, s1: 0.18, c0: Math.random() < 0.5 ? 0xffb0d0 : 0xffffff, c1: 0xff8ab0, a: 0.9, drag: 0.3, flit: 1 }); return; }
  if (kind === 'holy') { K.particles.spawn(x, y, z, { vx: (Math.random() - 0.5) * 0.3, vy: 1.6, vz: (Math.random() - 0.5) * 0.3, life: 2.2, s0: 0.45, s1: 0.1, c0: 0xfff0b0, c1: 0xffc84a, a: 0.85, drag: 0.4 }); return; }
  if (kind === 'dark') { K.particles.spawn(x, y, z, { vx: (Math.random() - 0.5) * 0.4, vy: 1.1, vz: (Math.random() - 0.5) * 0.4, life: 2.6, s0: 0.55, s1: 0.2, c0: 0xa050ff, c1: 0x200830, a: 0.75, drag: 0.4 }); return; }
  K.particles.spawn(x, y, z, { vx: 0, vy: 1, vz: 0, life: 2, s0: 0.6, s1: 2, c0: 0x8a8a96, c1: 0x30303c, a: 0.25, drag: 0.4 }); };
const evResEl = document.createElement('div'); evResEl.id = 'evres'; document.body.appendChild(evResEl);
const evTrkEl = document.createElement('div'); evTrkEl.id = 'evt'; document.body.appendChild(evTrkEl);
const evBanEl = document.createElement('div'); evBanEl.id = 'evglobal'; document.body.appendChild(evBanEl);
const eventos = createEvents({ scene: K.scene, heightAt, hero: () => K.heroPos, inside: () => !!K.inside, lvl: () => K.game.st.lvl, night: () => K.state.night,
  path: () => K.myPath(), elf: () => K.profile?.origin === 'elf', instinct: () => K.instintoSys.instinctOn, lean: () => K.soulLean(), xpNeedAt: (l) => K.game.xpNeedAt(l),
  spawn: (type, x, z, o) => K.game.enemies.spawn(type, x, z, o) as never, clearTag: (tag) => K.game.enemies.clearTag(tag), hurtBy: (e, n, from) => { if (K.game.enemies.hurtBy(e as never, n, from)) { /* morto por outro do evento: sem crédito */ } },
  region: (x, y) => regionAt(x, y), fx: evFx, bubble: K.carBubble, log: (t, c) => K.game.logMsg(t, c),
  project: (p) => { const v = p.clone().project(K.camera); if (v.z > 1) return null; const r = K.canvas.getBoundingClientRect(); return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height }; },
  converse: (o) => { let picked: Reply | null = null; K.openDlg({ name: o.name, role: o.role, portrait: null, text: '', choices: [], onAccept: () => {}, onTurnIn: () => {}, onReply: (r) => { if (r.flag?.startsWith('ev:')) picked = r; else K.applyReply(r); }, meet: { quest: { id: 'ev', name: o.title, lvl: 1, giver: o.name, text: '', objs: [], xp: 0, gold: 0 }, steps: o.steps, onEnd: () => o.onPick(picked) } }); },
  count: (it) => K.inv.count(it), take: (it, n) => K.inv.take(it, n), act: (a) => { K.hero.act(a as never, true); }, result: (r) => { if (r.won) addHonor(HONOR_FOR.event, `evento: ${r.name}`); K.showEvResult(r); } }, evSites);
  return { evFx, evResEl, eventos, evTrkEl, evBanEl, evSites };
}
