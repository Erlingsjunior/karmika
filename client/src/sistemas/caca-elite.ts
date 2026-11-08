/* COMPÊNDIO, BUSCA E CAPTURA (quem mentiu e fugiu) e MATERIAIS DE ELITE: o diário de criaturas, a caça ao fugitivo e o que os bichos elite deixam. Saiu do main.ts (02/11). */
import { addHonor, HONOR_FOR } from './honra';
import { createCompendium } from '../compendium';
import { type EnemyType, heightAt } from '../world';
import { TILE_M as T } from '@karmika/shared';
import { surrender, eyeSees } from '../surrender';
import * as THREE from 'three';
import { ELITE_MATS } from '../dados/npcs-dados';
import { DEFS } from '../enemies';
import { ITEMS as ITEMS_TBL } from '../inventory';
import type { CacaEliteCtx } from '../main';

/* busca e captura: quem mentiu e fugiu se esconde longe; achá-lo e matá-lo pesa MAIS (+14) do que tudo o que se perdeu */
export type Hunt = { qid: string; type: EnemyType; name: string; x: number; z: number; lvl: number };
export function createCacaElite(K: CacaEliteCtx) {
const compendium = createCompendium({ where: () => K.zoneName(), day: () => K.dayIndex(), lvl: () => K.game.st.lvl });
let hunt: Hunt | null = (() => { try { return JSON.parse(localStorage.getItem('karmika.hunt') || 'null'); } catch { return null; } })();
function spawnHunt(h: Hunt) { const e = K.game.enemies.spawn(h.type, h.x, h.z, { name: h.name, tag: 'hunt', hpMul: 3.5, dmgMul: 1.3, scale: 1.25, lvl: h.lvl }); (e as typeof e & { yielded?: boolean }).yielded = true; }
function startHunt(type: EnemyType, name: string, lvl: number) {
  const h0 = K.heroPosNow(); let x = h0.x, z = h0.z;
  for (let k = 0; k < 40; k++) { const a = Math.random() * 6.283, d = 70 + Math.random() * 50; const tx = h0.x + Math.cos(a) * d, tz = h0.z + Math.sin(a) * d; const gx = Math.floor(tx / T), gy = Math.floor(tz / T); if (K.city.map[gy]?.[gx] === 'grass' || K.city.map[gy]?.[gx] === 'road') { x = tx; z = tz; break; } }
  const qid = 'q_hunt_' + Date.now(), fname = `${name}, o Fugitivo`;
  hunt = { qid, type, name: fname, x, z, lvl: lvl + 2 }; try { localStorage.setItem('karmika.hunt', JSON.stringify(hunt)); } catch { /* */ }
  const dir = (() => { const a = Math.atan2(z - h0.z, x - h0.x) * 180 / Math.PI; const N = ['leste', 'sudeste', 'sul', 'sudoeste', 'oeste', 'noroeste', 'norte', 'nordeste']; return N[Math.round(((a + 360) % 360) / 45) % 8]; })();
  K.quests.accept({ id: qid, name: `Busca e captura: ${name}`, lvl: lvl + 2, giver: 'O Olho', turnin: 'O Olho', text: `${name} mentiu, cravou uma lâmina em você e fugiu para o ${dir}, a uns ${Math.round(Math.hypot(x - h0.x, z - h0.z))} m. Encontre-o e termine o que começou.`, objs: [{ kind: 'kill', type, n: 1 }], xp: Math.round(K.game.xpNeed() * 0.6), gold: 80 + lvl * 20 });
  spawnHunt(hunt); K.game.logMsg(`🩸 Nova caçada: ${fname} fugiu para o ${dir}.`, '#ff8a7a');
}
if (hunt) setTimeout(() => { if (hunt) spawnHunt(hunt); }, 1500);
K.game.setOnYield((e, decide) => {
  const hp = K.heroPosNow(), lvl = Math.max(2, (e.def.lvl ?? 1) + 2);
  surrender({ name: e.def.name, level: e.def.lvl ?? 1, demonic: ['prince', 'tormentor', 'bishop', 'imp'].includes(e.type),
    karma: (dk) => { K.addKarma(dk); }, log: (t, c) => K.game.logMsg(t, c),
    treasure: () => { K.game.spawnGear(hp.x, hp.z, heightAt(hp.x, hp.z), lvl + 2, { rare: 8, legendary: 6, relic: 3 }, 2, 'rare'); K.game.st.gold += 60 + lvl * 15; K.game.logMsg('💰 Tesouros caem aos seus pés.', '#ffd24a'); },
    xp: (f) => K.game.gainXp(Math.round(K.game.xpNeed() * f)), tome: () => K.inv.add('tome', 1), hurt: (f) => K.game.damage(Math.round(K.game.st.hpMax * f), K.heroPosNow()),
    kill: () => { K.feats.bump('executed'); K.breakVow('misericordia'); decide(true); }, spare: () => { K.feats.bump('spared'); decide(false); }, record: (r) => { compendium.add(r); if (/recusou o suborno/i.test(r.title)) K.feats.bump('bribe_no'); if (/vendeu a sua nobreza/i.test(r.title)) K.feats.bump('bribe_yes'); }, fled: () => startHunt(e.type, e.def.name, e.def.lvl ?? 1), sealed: !K.profile?.eye });
});
/* materiais de elite (25/10): bicho elite (maior que o normal, ou com nome próprio) deixa couro, presa, chifre, casco ou cerne
   — só com eles o Mestre-Forjador Brokki, em Brasaforja, forja as peças lendárias */
function eliteDrop(t: EnemyType, e: { def: { name: string; scale?: number; lvl?: number }; pos: THREE.Vector3 }) {
  const m = ELITE_MATS[t]; if (!m) return; const base = DEFS[t]; const elite = (e.def.scale ?? 1) > (base?.scale ?? 1) * 1.2 || (!!base && e.def.name !== base.name); if (!elite) return;
  const got: string[] = [m[0]]; if (Math.random() < 0.55) got.push(m[1]); if (Math.random() < 0.25) got.push(m[0]);
  for (const id of got) K.inv.add(id, 1); K.audio.coins?.(2);
  for (let i = 0; i < 24; i++) K.particles.spawn(e.pos.x, e.pos.y + 1, e.pos.z, { vx: (Math.random() - 0.5) * 3, vy: 1 + Math.random() * 3, vz: (Math.random() - 0.5) * 3, life: 1, s0: 0.25, s1: 0.04, c0: 0xffe8a0, c1: 0xff8a2a, a: 1, g: 4 });
  K.game.logMsg(`✦ ${e.def.name} deixou material de elite: ${got.map((id) => ITEMS_TBL[id]?.name ?? id).join(', ')}. O Mestre-Forjador Brokki, em Brasaforja, sabe o que fazer com isso.`, '#ffb060');
}
K.game.setOnKill((t, e) => { try { eliteDrop(t, e as never); } catch { /* */ } /* 08/11 Honra Kármica: elite derrubado */ try { const ee = e as unknown as { type: string; hpMax: number; tag?: string; def: { lvl?: number } }; if (ee.type === 'prince' || ee.type === 'tormentor' || ee.type === 'treant' || ee.type === 'werewolf' || (ee.tag === 'dg' && ee.hpMax > 1500)) addHonor(HONOR_FOR.elite, ee.type === 'prince' ? 'príncipe' : 'elite'); } catch { /* */ } try { K.decoDrop(e as never, t); } catch { /* */ } K.featKill(t, e); K.eventos.onKill(e as never); K.gevNote((h) => { h.kills++; }); K.alignKill(e as never); if (t === 'deer' && K.myPath() !== 'lob') K.breakVow('inocente'); K.feastOnKill(t, e as never); /* o lobo caça para comer: cervo não é sangue inocente para a matilha */ K.dgs.onKill(e as never); if (K.SKIN[t]) (e as typeof e & { corpse?: number }).corpse = 90; /* a fera fica no chão para ser esfolada */ if ((e as typeof e & { tag?: string }).tag === 'hunt' && hunt) { const h = hunt; hunt = null; localStorage.removeItem('karmika.hunt'); K.feats.bump('hunts'); const sealedH = !K.profile?.eye; if (!sealedH) K.addKarma(14);
  const what = `Você encontrou ${h.name} no esconderijo e terminou o que ele mesmo começou com a mentira.`; compendium.add({ title: `${h.name}: justiça tardia`, what, delta: 14, sealed: sealedH }); if (sealedH) K.game.logMsg('🌑 Em algum lugar, algo que ainda dorme guardou o que você fez.', '#a898c8');
  if (!sealedH) setTimeout(() => { eyeSees('Justiça tardia.', what, 'Você foi enganado uma vez, e pagou por isso. Mas não deixou a mentira vencer: buscou, encontrou e cumpriu o seu papel. A ingenuidade se apaga diante da persistência.', 14); const d = K.quests.q.active[h.qid] ? K.quests.offers('O Olho') : null; void d; }, 600);
  setTimeout(() => { const d2 = (K.quests as unknown as { turnins(n: string): { id: string }[] }).turnins('O Olho').find((x) => x.id === h.qid); if (d2) K.quests.turnIn(d2 as never); }, 900); } K.quests.onKill(t); if ((e as typeof e & { tag?: string }).tag === 'crypt') K.pourBlood(e); for (const fl of K.CRYPT_FLOORS) if (fl.elite && fl.elite.seal && e.def.name === fl.elite.name) { K.inv.add(fl.elite.seal, 1); K.chat.sys(`✦ ${fl.elite.name} caiu e deixou o ${ITEMS_TBL[fl.elite.seal]?.name ?? fl.elite.seal}.`); }
  if (e.def.name === 'Bispo Caído') { K.heroicAct('O Bispo Caído foi derrubado — a Catedral respira'); K.addKarma(20); localStorage.setItem('karmika.crypt.done', '1'); K.chat.sys('✦ O Olho derrama uma lágrima sobre o trono negro. A Catedral Abandonada está purificada.'); K.game.logMsg('🏅 Título: Purificador da Catedral', '#ffe08a'); if (K.profile) { K.profile.title = 'Purificador da Catedral'; localStorage.setItem('karmika.char.v1', JSON.stringify(K.profile)); K.updateWho(); } return; }
  if (e.def.name === 'Sacerdote Maldito') { K.heroicAct('O Sacerdote Maldito caiu — a Catedral respira'); K.addKarma(15); K.inv.add('tome', 2); localStorage.setItem('karmika.crypt.done', '1'); K.chat.sys('✦ Uma lágrima do Olho cai sobre o altar negro. A Catedral Abandonada foi purificada.'); K.game.logMsg('🏅 Título: Purificador da Catedral', '#ffe08a'); if (K.profile) { K.profile.title = 'Purificador da Catedral'; localStorage.setItem('karmika.char.v1', JSON.stringify(K.profile)); K.updateWho(); } return; } if (t === 'tormentor' || t === 'prince') K.heroicAct(`${DEFS[t].name} derrotado`); });
  return { compendium };
}
