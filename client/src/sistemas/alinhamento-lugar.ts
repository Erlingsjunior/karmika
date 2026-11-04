/* ALINHAMENTO KÁRMICO COM CADA LUGAR (alinhamento.ts): de onde é o herói, o reencontro, o abate que pesa, o preço por lugar. Saiu do main.ts (02/11). */
import { createAlign } from '../alinhamento';
import { REGIONS, regionAt } from '../world';
import { FAC, myFac } from '../faccoes';
import { TILE_M as T } from '@karmika/shared';
import { questCat } from '../quests';
import * as THREE from 'three';
import type { AlinhamentoLugarCtx } from '../main';

export function createAlinhamentoLugar(K: AlinhamentoLugarCtx) {
/* ---------- ALINHAMENTO KÁRMICO com cada lugar (alinhamento.ts) e a festa de despedida de Karmika ---------- */
const align = createAlign({ places: () => K.city.settlements.filter((q) => q.radius >= 10).map((q) => ({ name: q.name, kind: q.kind === 'city' || q.name === 'Karmika' ? 'city' as const : 'village' as const })), regions: () => REGIONS.map((r) => r.name),
  factions: () => Object.entries(FAC).map(([id, f]) => ({ id, name: f.name })), myFac: () => myFac(), log: (t, c) => K.game.logMsg(t, c), status: () => K.festaStatus() });
const settleAt = (x: number, y: number, pad = 6) => K.city.settlements.find((q) => q.radius >= 10 && Math.hypot(x - q.x, y - q.y) < q.radius + pad) ?? null;
const hereSettle = () => { const h0 = K.hereT(); return settleAt(h0.x, h0.y); };
const npcHome = (nm: string) => { const n = K.npcSys.npcs.find((q) => q.def.name === nm); return n ? settleAt(n.def.x / T, n.def.z / T, 12) : null; };
/* quem já jogava antes do alinhamento existir: as missões feitas contam (uma vez só) */
/* quem já jogava antes do alinhamento existir: cada missão feita conta uma vez só (marcada por id). Roda no relógio do alinhamento,
   só depois que o personagem e os NPCs do mundo carregaram — antes, o cálculo rodava na tela de personagens e marcava "feito" sem contar nada. */
let alignCU = 0;
function alignCatchup() { if (!K.profile || K.inicio.isOpen || K.peleSys.creating || !K.npcSys.npcs.length) return; const nowC = performance.now(); if (nowC < alignCU) return; alignCU = nowC + 4000;
  if (align.flag('seed1') && !align.flag('seed2')) { /* a semente antiga: se ela chegou a contar alguma coisa, as missões feitas até aqui já valeram */ if (align.places().some((p) => align.get('vila', p.name) > 0)) for (const id of K.quests.q.done) align.setFlag('q:' + id); align.setFlag('seed2'); }
  align.setFlag('seed2'); let n = 0;
  for (const id of K.quests.q.done) { if (align.flag('q:' + id)) continue; const d = K.quests.def(id); if (!d || id.startsWith('b_')) { align.setFlag('q:' + id); continue; } const st = npcHome(d.turnin ?? d.giver) ?? npcHome(d.giver); if (!st) continue;
    const story = questCat(d) === 'story'; align.add('vila', st.name, story ? 6 : 3, undefined, true); align.add('regiao', regionAt(st.x, st.y).name, story ? 2 : 1, undefined, true); align.setFlag('q:' + id); n++; }
  if (n) { const h = hereSettle(); K.game.logMsg(`🏘 ${n} missões antigas contaram para o seu Alinhamento Kármico${h ? `: ${h.name} agora te vê como ${align.tier('vila', h.name).name}` : ''}.`, h ? align.tier('vila', h.name).col : '#ffe08a'); } }
queueMicrotask(() => K.quests.addDoneHook((d) => { if (d.id === 'gu1') { try { localStorage.setItem(K.CARTA_K, '1'); } catch { /* */ } setTimeout(() => K.social.startFounding(), 600); }
  align.setFlag('q:' + d.id); const st = npcHome(d.turnin ?? d.giver) ?? npcHome(d.giver); const story = questCat(d) === 'story';
  if (st) { align.add('vila', st.name, story ? 6 : 3, d.name); align.add('regiao', regionAt(st.x, st.y).name, story ? 2 : 1); }
  const f = myFac(); if (f) { align.add('faccao', f, 1); for (const k2 of Object.keys(FAC)) if (k2 !== f) align.add('faccao', k2, -1); } }));
/** quem defende as casas: bicho derrubado perto do povoado soma um pouquinho */
function alignKill(e: { pos?: THREE.Vector3; def?: { passive?: boolean } } | undefined) { if (!e?.pos || e.def?.passive) return; const st = settleAt(e.pos.x / T, e.pos.z / T, 25); if (st) align.add('vila', st.name, 0.05); }
/* chegada e volta: quem é querido é recebido; a festa só acontece uma vez */
let alignChk = 0, alignHere = '';
function alignTick(dt: number) { void dt; const nowA = performance.now(); if (nowA < alignChk) return; alignChk = nowA + 1000; /* relógio de verdade */ alignCatchup(); const st = hereSettle(), nm = st?.name ?? '';
  if (nm && nm !== alignHere) { const away = align.arrive(nm), t = align.tier('vila', nm);
    if (away > 10 * 60000 && t.min >= 30) { K.game.logMsg(`🏘 ${nm} te recebe de braços abertos (${t.name}).`, t.col); setTimeout(() => K.npcSys.say(align.flag('festa_' + nm) === 1 ? 'Você voltou! A festa ainda é assunto na taverna.' : 'Olha quem voltou! Bem-vindo de volta!', K.heroPos), 900); }
    else if (away > 10 * 60000 && t.min <= -60) K.game.logMsg(`🏘 Em ${nm} as portas se fecham quando você passa (${t.name}).`, t.col); }
  if (nm !== alignHere && K.festaSys.festaAsked && K.festaSys.festaAsked !== nm) K.festaSys.festaAsked = '';
  alignHere = nm;
  if (nm && !K.festaSys.festa && !K.dlg.isOpen && !document.querySelector('.kconf')) K.festaOffer(nm); /* com a conversa aberta o convite nascia escondido atrás dela (e o ESC da conversa fechava os dois) */
  K.festaPendTick(); if (K.festaSys.festa) K.festaTick(); }
/** preço nas lojas do lugar onde você está */
const alignPriceK = () => { const st = hereSettle(); return st ? align.tier('vila', st.name).price : 1; };
/* a festa de despedida (Erling, 25/10): o centro da praça enfeitado, a carroça do anão com cerveja, churrasco e fogos por tudo o que você fez */
addEventListener('karmika:align', () => align.toggle(true));
  return { hereSettle, align, alignPriceK, settleAt, npcHome, alignKill, alignTick };
}
