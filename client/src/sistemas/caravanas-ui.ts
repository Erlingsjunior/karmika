/* A COMPANHIA DAS CARAVANAS DE LATÃO: os balões de fala das carroças, a ponte, as missões das caravanas e o salão de ofícios. Saiu do main.ts (02/11). */
import * as THREE from 'three';
import { TILE_M as T } from '@karmika/shared';
import { createCaravans, buildRoutes } from '../caravanas';
import { heightAt, CITY } from '../world';
import { eyeSees } from '../surrender';
import { createCraftHall } from '../oficios';
import { fine } from '../dual3d';
import type { CaravanasUiCtx } from '../main';

export function createCaravanasUi(K: CaravanasUiCtx) {
/* ---------- A Companhia das Caravanas de Latão (caravanas.ts, 24/10): carroças a vapor nas estradas, escoltas, resgates e emboscadas ---------- */
const carBubbles: { el: HTMLElement; p: THREE.Vector3; t: number }[] = [];
function carBubble(x: number, y: number, z: number, text: string) { for (const b of carBubbles.splice(0)) b.el.remove(); const el = document.createElement('div'); el.className = 'cbub'; el.textContent = text; document.body.appendChild(el); carBubbles.push({ el, p: new THREE.Vector3(x, y, z), t: 4.5 }); }
function updateCarBubbles(dt: number) { const r = K.canvas.getBoundingClientRect(); for (let i = carBubbles.length - 1; i >= 0; i--) { const b = carBubbles[i]; b.t -= dt; if (b.t <= 0) { b.el.remove(); carBubbles.splice(i, 1); continue; } const v = b.p.clone().project(K.camera); b.el.style.display = v.z < 1 && !K.inside ? 'block' : 'none'; b.el.style.left = r.left + (v.x * 0.5 + 0.5) * r.width + 'px'; b.el.style.top = r.top + (-v.y * 0.5 + 0.5) * r.height + 'px'; b.el.style.opacity = String(Math.min(1, b.t)); } }
const onBridgeM = (x: number, z: number) => { const tx = x / T, tz = z / T; for (const b of K.city.bridges) { const dx = b.bx - b.ax, dy = b.by - b.ay, L2 = dx * dx + dy * dy || 1; let u = ((tx - b.ax) * dx + (tz - b.ay) * dy) / L2; u = Math.max(0, Math.min(1, u)); const px = b.ax + dx * u, py = b.ay + dy * u; if (Math.hypot(tx - px, tz - py) < 3 && u > -0.01) { const ext = Math.hypot(dx, dy); void ext; return true; } } return false; };
/* 11/11 (Erling: "as carroças não têm inteligência, se trombam e passam por partes que não podem"): a carroça agora OLHA o chão.
   - portão (de vila ou de muralha) conta como ponte: ela vai para o meio da estrada e passa pelo vão;
   - fora dali, caravanas.ts pergunta a `blocked` se o corpo dela cabe na mão; se não cabe, procura a faixa livre mais perto. */
const GATES = K.city.props.filter((p) => p.kind === 'gatehouse' || p.kind === 'vgate').map((p) => ({ x: (p.gx + p.w / 2) * T, z: (p.gy + p.h / 2) * T }));
const nearGate = (x: number, z: number, r: number) => GATES.some((g) => Math.abs(g.x - x) < r && Math.abs(g.z - z) < r);
const caravans = createCaravans({ onBridge: (x, z) => onBridgeM(x, z) || nearGate(x, z, 9), blocked: (x, z) => !nearGate(x, z, 6) && K.wagonBlocked(x, z), shopOpen: () => K.inv.isOpen, trade: (r, carroca) => { if (carroca === 'carrocaDosAnoes') { K.openDwarfCart(r.name); return; } /* 27/10 (Erling): só a carroça a vapor vende coisa de tecnocrata; a carroça anã (e a das estradas humanas, que é a mesma carroça) vende carnes, cervejas, peças e tem a aba das festas */ K.prepLatao(); K.inv.openShop('latao', `Caravana de Latão · ${r.name}`); }, scene: K.scene, heightAt, hero: () => K.heroPos, night: () => K.state.night, inside: () => !!K.inside, lvl: () => K.game.st.lvl,
  spawn: (type, x, z, o) => K.game.enemies.spawn(type, x, z, o) as never, clearTag: (tag) => K.game.enemies.clearTag(tag), hurt: (e, n, from) => { K.game.enemies.hurt(e as never, n, from); },
  smoke: (x, y, z, dark) => K.particles.spawn(x, y, z, { vx: (Math.random() - 0.5) * 0.5, vy: 1.5, vz: (Math.random() - 0.5) * 0.5, life: 3.0, s0: 0.6, s1: 3.0, c0: dark ? 0x3a3438 : 0xc8c4c0, c1: dark ? 0x141014 : 0x5a5860, a: dark ? 0.4 : 0.4, drag: 0.5 }),
  ember: (x, y, z) => K.particles.spawn(x, y, z, { vx: (Math.random() - 0.5) * 1.4, vy: 0.8 + Math.random() * 1.6, vz: (Math.random() - 0.5) * 1.4, life: 0.9, s0: 0.1, s1: 0.02, c0: 0xffe08a, c1: 0xff4a10, a: 1, drag: 0.8 }),
  bubble: carBubble, log: (t, c) => K.game.logMsg(t, c), lean: () => K.soulLean(),
  nearTown: (x, z) => { const tx = x / T, ty = z / T; return K.city.settlements.some((st) => Math.hypot(st.x - tx, st.y - ty) < st.radius + 6) || Math.hypot(CITY.x - tx, CITY.y - ty) < 30; },
  onEscort: (id) => K.quests.onCaravan('escort', id), onRescue: (id) => K.quests.onCaravan('rescue', id),
  onEvent: (r, how) => { const lv = Math.max(K.game.st.lvl, r.lvl - 5), xp = Math.round(K.game.xpNeedAt(lv) * 0.22);
    if (how === 'salva') { const g = 40 + lv * 4; K.game.st.gold += g; K.game.gainXp(xp); K.addKarma(2); K.applyReply({ t: '', luz: 1 });
      K.game.logMsg(`⚙ Os sobreviventes da caravana agradecem. A Companhia de Latão paga o resgate: +${g} ouro, +${xp} XP. Na loja da Companhia, você tem desconto por meia hora.`, '#e0b048'); }
    else { const g = 120 + lv * 9; K.game.st.gold += g; K.addKarma(-(5)); K.applyReply({ t: '', sombra: 2, flag: 'saqueou_caravana' });
      K.game.logMsg(`💰 Você abre as caixas sem dono e enche os bolsos: +${g} ouro. Ninguém viu. A Companhia vai saber mesmo assim.`, '#c98a9a'); setTimeout(() => eyeSees('O Olho guardou.', 'Saqueou uma caravana caída.', 'Os cocheiros estavam mortos e a carga não tinha dono. Mas tinha: as famílias que esperavam o pagamento da viagem.', -5), 700); } } },
  buildRoutes(K.city.roadPaths, K.city.roadLinks ?? []));
/** a escolta e o resgate só existem enquanto a missão está no diário */
function syncCaravanQuests() { const want = new Set<string>();
  for (const [id] of Object.entries(K.quests.q.active)) { const d = K.quests.def(id); if (!d) continue; d.objs.forEach((o, i) => { if (K.quests.objProg(d, i) >= 1) return;
    if (o.kind === 'escort') { want.add('esc:' + o.route); if (!caravans.escorting(o.route)) caravans.startEscort(o.route); }
    if (o.kind === 'rescue') { want.add('res:' + o.route); caravans.startRescue(o.route, o.at, o.note); } }); }
  for (const r of caravans.routes.keys()) { if (!want.has('esc:' + r) && caravans.escorting(r) && !caravans.arrivedEsc(r)) caravans.stopEscort(r); if (!want.has('res:' + r)) caravans.stopRescue(r, true); } }
let carSyncT = 0;
/* a Casa dos Ofícios de Askavik (oficios.ts) */
const craftHall = K.city.craftHall ? createCraftHall({ scene: K.scene, T, heightAt, fine, particles: K.particles, bubble: (x, y, z, tx) => carBubble(x, y, z, tx), audio: K.audio }, K.city.craftHall) : null;
function updateCaravans(dt: number) { const nowMs = performance.now(); if (nowMs > carSyncT) { carSyncT = nowMs + 700; syncCaravanQuests(); } caravans.update(dt, K.t); updateCarBubbles(dt); }
/** a loja da Companhia: o estoque e o preço dependem das caravanas que chegaram (ou não) */
const LATAO_BASE = ['reator_1', 'reator_2', 'cristal_arcano', 'inj_s', 'semente_mod', 'sino_guarda', 'potion_g', 'mana', 'tonic', 'antidote', 'rope', 'scroll_return', 'bag_l'], LATAO_PORTO = ['bag_xl', 'pick_st', 'axe_st', 'knife_st'];
  return { caravans, LATAO_BASE, LATAO_PORTO, carBubble, updateCaravans, craftHall };
}
