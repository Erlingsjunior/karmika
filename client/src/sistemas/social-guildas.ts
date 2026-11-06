/* AMIGOS, CONVERSAS E GUILDAS (hub.ts e social.ts): escrituras de casa, casas dos outros, terrenos e salões de guilda, o PvP de facção, entrar no servidor, o início, o cartão do herói e o balão de fala. Saiu do main.ts (02/11). */
import { FOUND_NEAR_M } from './guilda-fundacao';
import { createHub } from '../hub';
import { registerDeed, deedIdOf, DEEDS, ITEMS as ITEMS_TBL } from '../inventory';
import { onHomeSave } from '../obras';
import { badge } from '../celebrate';
import { wholeOf } from '../build';
import { type Guild, createSocial } from '../social';
import * as THREE from 'three';
import { gpuState } from '../gpu/tags';
import { TILE_M as T } from '@karmika/shared';
import { heightAt } from '../world';
import { buyFxLast } from '../windows';
import { isTool as isToolId } from '../tools';
import { RARITY } from '../loot';
import { IS_DEV } from '../premium';
import { myFac, FAC, type Fac } from '../faccoes';
import { createInicio } from '../inicio';
import type { SocialGuildasCtx } from '../main';

export function createSocialGuildas(K: SocialGuildasCtx) {
/* ---------- AMIGOS, CONVERSAS E GUILDAS (26/10) — hub.ts (conta e conexão leve) e social.ts (a janela) ---------- */
const hub = createHub({ char: () => K.profile?.name ?? '', where: () => (K.profile && !inicio.isOpen && !K.peleSys.creating) ? 'mundo' : 'menu' });
/* A ESCRITURA E O CONTRATO DE COMPRA E VENDA (28/10, Erling): a escritura é um item único dinâmico (escritura_<número>) que
   "recebe" a casa. O dono a vê como documento. Quem a recebe (leilão, correio, troca) e a usa abre o contrato de compra e venda:
   escreve o nome do personagem, assina, e o servidor passa a casa para ele. O antigo dono é avisado e a casa sai do mundo dele. */
const placeOf = (gx: number, gy: number) => K.city.settlements.find((st) => Math.hypot(st.x - gx, st.y - gy) < st.radius + 30)?.name ?? 'Karmika';
function deedItemOf(h: { deedId?: string; name: string; owner: string; gx: number; gy: number; w: number; h: number; deed?: number }) {
  if (!h.deedId) return 'escritura_casa'; registerDeed({ id: h.deedId, house: h.name, owner: h.owner, place: placeOf(h.gx, h.gy), gx: h.gx, gy: h.gy, w: h.w, h: h.h, since: h.deed }); return 'escritura_' + h.deedId; }
let deedWait: string | null = null;
function useDeed(itemId: string) {
  const mine = K.obras.home;
  if (itemId === 'escritura_casa') { /* a escritura antiga (sem número): vira a escritura da sua casa */ if (mine && mine.done >= mine.work && mine.deedId) { K.inv.take('escritura_casa', 1); const nid = deedItemOf(mine); K.inv.add(nid, 1, true); K.game.logMsg('📃 O Cartório numerou a sua escritura.', '#ffe08a'); return deedPage(deedIdOf(nid)!, true); } return deedPage(null, true); }
  const id = deedIdOf(itemId)!; const meta = DEEDS[id];
  if (mine?.deedId === id) return deedPage(id, true);
  if (!meta) { if (hub.state !== 'on') { K.game.logMsg('📃 Para ler esta escritura, conecte-se ao servidor: o Cartório guarda os registros lá.', '#ff9a8a'); return; } deedWait = itemId; hub.send({ t: 'h:deed', id }); K.game.logMsg('📃 Consultando o Cartório…', '#c8b890'); return; }
  deedPage(id, false); }
function deedPage(id: string | null, own: boolean) {
  const m = id ? DEEDS[id] : null, me = K.profile?.name || 'Caminhante', d = document.createElement('div'); d.className = 'kchoice deedw';
  const when = m?.since ? new Date(m.since).toLocaleDateString('pt-BR') : '—';
  if (!m) d.innerHTML = `<div class="pn"><h2>📃 Escritura</h2><p class="dl">Esta escritura ainda não corresponde a uma casa de pé.</p><div class="row"><button data-n>Guardar</button></div></div>`;
  else if (own) d.innerHTML = `<div class="pn"><h2>📃 Escritura da Casa</h2><p class="dl">Pelo presente documento, o Cartório de Karmika declara que</p><p class="dn">${m.owner}</p><p class="dl">é o legítimo dono da</p><p class="dh">${m.house}</p><p class="dl">erguida no chão de ${m.place ?? 'Karmika'} (marco ${m.gx}·${m.gy}), com ${m.w}×${m.h} braças, de pé desde ${when}.</p><p class="dl dno">Escritura nº ${id!.toUpperCase()}</p><div class="ds"><span>${m.owner}</span><i>✦ selo do Cartório ✦</i></div><p class="dl dsmall">Quem tem esta escritura pode tomar posse da casa. Para vender, ponha a escritura no leilão ou mande pelo correio.</p><div class="row"><button data-n>Guardar</button></div></div>`;
  else d.innerHTML = `<div class="pn"><h2>📜 Contrato de Compra e Venda</h2><p class="dl">Pelo presente contrato, o Cartório de Karmika registra que a</p><p class="dh">${m.house}</p><p class="dl">erguida no chão de ${m.place ?? 'Karmika'} (marco ${m.gx}·${m.gy}), com ${m.w}×${m.h} braças, que pertencia a <b>${m.owner}</b>, passa a pertencer a quem assina abaixo, portador desta escritura (nº ${id!.toUpperCase()}).</p>
      <label class="dl" for="deed-sign">Escreva o nome do seu personagem para assinar:</label><input id="deed-sign" class="dsign" maxlength="24" placeholder="${me}" autocomplete="off"><p class="dl dsmall" id="deed-msg"></p>
      <div class="row"><button data-y>✒ Assinar e tomar posse</button><button data-n>Agora não</button></div></div>`;
  document.body.appendChild(d); d.querySelector('[data-n]')?.addEventListener('click', () => d.remove());
  d.querySelector('[data-y]')?.addEventListener('click', () => { const v = (d.querySelector('#deed-sign') as HTMLInputElement).value.trim(), msg = d.querySelector('#deed-msg') as HTMLElement;
    if (v.toLowerCase() !== me.toLowerCase()) { msg.textContent = `Assine com o nome do seu personagem: ${me}.`; return; }
    if (K.obras.home) { msg.textContent = 'Você já tem uma casa (ou uma obra). Por enquanto, uma por personagem.'; return; }
    if (hub.state !== 'on') { msg.textContent = 'Conecte-se ao servidor: a posse é registrada no Cartório de lá.'; return; }
    hub.send({ t: 'h:transfer', id }); msg.textContent = 'O Cartório está registrando…'; (d.querySelector('[data-y]') as HTMLButtonElement).disabled = true; setTimeout(() => d.remove(), 2500); }); }
hub.on('h:deedinfo', (m) => { const dm = m.deed as { id: string; house: string; owner: string; gx: number; gy: number; w: number; h: number; since?: number } | null; if (!dm) { K.game.logMsg('📃 O Cartório não encontrou a casa desta escritura.', '#ff9a8a'); deedWait = null; return; }
  registerDeed({ ...dm, place: placeOf(dm.gx, dm.gy) }); if (deedWait) { const w = deedWait; deedWait = null; useDeed(w); } });
hub.on('h:tdeny', (m) => K.game.logMsg(`📃 ${String(m.why || 'O Cartório recusou o contrato.')}`, '#ff9a8a'));
hub.on('h:sold', (m) => { if (K.obras.home && (!m.deedId || K.obras.home.deedId === m.deedId)) K.obras.release(`📃 ${String(m.to)} assinou a escritura e tomou posse da ${String(m.name)}. A casa não é mais sua.`); });
/* AS CASAS NO SERVIDOR (28/10, Erling): o servidor guarda a casa de cada personagem num arquivo próprio, que sobrevive aos resets.
   Aqui: cada mudança da obra/casa sobe (de 2 em 2 s no máximo); ao ligar, o servidor manda a dele e o de-para acerta (casa perdida
   volta, andamento maior fica). As casas dos outros reservam o chão (ninguém constrói por cima) e as prontas aparecem no mundo. */
let hSyncT: ReturnType<typeof setTimeout> | null = null, hPend: unknown = undefined, hGot = '';
onHomeSave((h) => { hPend = h; if (hSyncT) return; hSyncT = setTimeout(() => { hSyncT = null; const v = hPend; hPend = undefined; if (v === undefined) return; hub.send(v ? { t: 'h:sync', house: v } : { t: 'h:del' }); }, 2000); });
const askHouse = () => { const c = K.profile?.name ?? ''; if (!c || hub.state !== 'on' || hGot === c) return; hGot = c; hub.send({ t: 'h:get' }); };
hub.on('a:me', () => { hGot = ''; setTimeout(askHouse, 600); }); setInterval(askHouse, 3000);
hub.on('h:mine', (m) => { if (m.bought) { badge('🏡', 'Casa comprada', String((m.house as { name?: string })?.name ?? '')); const hh = m.house as { deedId?: string; name: string; owner: string; gx: number; gy: number; w: number; h: number; since?: number }; if (hh?.deedId) registerDeed({ id: hh.deedId, house: hh.name, owner: hh.owner, place: placeOf(hh.gx, hh.gy), gx: hh.gx, gy: hh.gy, w: hh.w, h: hh.h, since: hh.since }); } const r = K.obras.fromServer((m.house as never) ?? null); if (r === 'up' && K.obras.home) hub.send({ t: 'h:sync', house: K.obras.home }); });
hub.on('h:deny', (m) => K.game.logMsg(`🏡 ${String(m.why || 'O servidor recusou a casa.')}`, '#ff9a8a'));
const otherHouses: { char: string; name: string; gx: number; gy: number; w: number; h: number; done: boolean; signed: boolean; id?: string; decor?: { id: string; x: number; z: number; r: number; i: number }[] }[] = []; const otherDecor = new Map<(typeof K.city.props)[number], NonNullable<(typeof otherHouses)[number]['decor']>>(); const otherProps = new Map<string, (typeof K.city.props)[number]>();
hub.on('h:all', (m) => { const me = (K.profile?.name ?? '').toLowerCase(); otherHouses.length = 0; for (const c of (m.list as typeof otherHouses) ?? []) if (c.char.toLowerCase() !== me && [c.gx, c.gy, c.w, c.h].every(Number.isFinite)) otherHouses.push(c);
  for (const c of otherHouses) { const k = c.char.toLowerCase() + '@' + c.gx + ',' + c.gy; if (!c.done || otherProps.has(k)) continue; let free = true; for (let y = c.gy; y < c.gy + c.h && free; y++) for (let x = c.gx; x < c.gx + c.w; x++) if (K.city.map[y]?.[x] !== 'grass') { free = false; break; } if (!free) continue;
    const p = { kind: 'house', gx: c.gx, gy: c.gy, w: c.w, h: c.h, height: 3.4, wall: 0xb09068, roof: 0x8a3a28, variant: wholeOf(undefined, c.name).variant, style: wholeOf(undefined, c.name).style, rot: 0, label: `Casa de ${c.char}` } as (typeof K.city.props)[number]; K.objs.addProp(p); otherProps.set(k, p); for (let y = c.gy; y < c.gy + c.h; y++) for (let x = c.gx; x < c.gx + c.w; x++) K.city.map[y][x] = 'wall'; }
  otherDecor.clear(); for (const c of otherHouses) { const p = otherProps.get(c.char.toLowerCase() + '@' + c.gx + ',' + c.gy); if (p && c.done) otherDecor.set(p, c.decor ?? []); } K.decoRenderOthers(); });
/* os terrenos das guildas: quadras de 10×10 de capim livre em volta de Lumenhal, a cidade média (todos calculam igual: o mundo é o mesmo) */
const GPLOT = 10;
const guildPlots = (() => { const lu = K.city.settlements.find((q) => q.name === 'Lumenhal'); if (!lu) return [] as { x0: number; y0: number }[]; const out: { x0: number; y0: number }[] = [];
  const free = (x0: number, y0: number) => { for (let y = y0 - 1; y <= y0 + GPLOT; y++) for (let x = x0 - 1; x <= x0 + GPLOT; x++) if (K.city.map[y]?.[x] !== 'grass') return false; for (const p of K.city.props) if (p.gx + p.w > x0 - 1 && p.gx < x0 + GPLOT + 1 && p.gy + p.h > y0 - 1 && p.gy < y0 + GPLOT + 1 && p.kind !== 'tree' && p.kind !== 'rock' && p.kind !== 'herb') return false; return true; };
  for (let r = lu.radius + 8; r < lu.radius + 90 && out.length < 24; r += 3) for (let k = 0; k < 48 && out.length < 24; k++) { const a = (k / 48) * 6.283, x0 = Math.round(lu.x + Math.cos(a) * r - GPLOT / 2), y0 = Math.round(lu.y + Math.sin(a) * r - GPLOT / 2);
    if (out.some((q) => Math.abs(q.x0 - x0) < GPLOT + 3 && Math.abs(q.y0 - y0) < GPLOT + 3)) continue; if (free(x0, y0)) out.push({ x0, y0 }); }
  return out; })();
let guildWorld: { id: number; name: string; tag: string; col: string; plot: number; build: { kind: string; gx: number; gy: number; v: number }[] }[] = [], myGuild: Guild | null = null;
function guildZoneAt(gx: number, gy: number): 'mine' | 'other' | null { for (const g of guildWorld) { const P = guildPlots.at(g.plot); if (P && gx >= P.x0 && gx < P.x0 + GPLOT && gy >= P.y0 && gy < P.y0 + GPLOT) return myGuild && myGuild.id === g.id && ['membro', 'oficial', 'lider'].includes(myGuild.members.find((m) => m.name.toLowerCase() === (K.profile?.name ?? '').toLowerCase())?.rank ?? '') ? 'mine' : 'other'; } return null; }
const guildGfx = new THREE.Group(); K.scene.add(guildGfx);
function drawGuilds() {
  for (const c of [...guildGfx.children]) { guildGfx.remove(c); c.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose?.(); }); }
  for (const g of guildWorld) { const P = guildPlots.at(g.plot); if (!P) continue; const col = new THREE.Color(g.col);
    const cx = (P.x0 + 1.5) * T, cz = (P.y0 + 1.5) * T, y = heightAt(cx, cz); const grp = new THREE.Group(); grp.position.set(cx, y, cz); guildGfx.add(grp);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 6.5, 8), new THREE.MeshToonMaterial({ color: 0x4a3220 })); pole.position.y = 3.25; grp.add(pole);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 8), new THREE.MeshToonMaterial({ color: 0xd8b04a })); tip.position.y = 6.65; grp.add(tip);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.6, 6, 1), new THREE.MeshToonMaterial({ color: col, side: THREE.DoubleSide })); flag.position.set(0.95, 5.0, 0); flag.userData.flag = 1; grp.add(flag);
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96; const gx = cv.getContext('2d')!; gx.fillStyle = '#2a1a0e'; gx.fillRect(0, 0, 256, 96); gx.strokeStyle = g.col; gx.lineWidth = 6; gx.strokeRect(3, 3, 250, 90); gx.fillStyle = '#ffe8b0'; gx.font = 'bold 30px Georgia, serif'; gx.textAlign = 'center'; gx.fillText(`[${g.tag}]`, 128, 40); gx.font = '20px Georgia, serif'; gx.fillText(g.name.slice(0, 24), 128, 74);
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshBasicMaterial({ map: tx, side: THREE.DoubleSide })); sign.position.set(0, 2.2, 0.15); grp.add(sign);
    const ring: THREE.Vector3[] = []; for (const [x, z] of [[0, 0], [GPLOT, 0], [GPLOT, GPLOT], [0, GPLOT], [0, 0]]) { const wx = (P.x0 + x) * T, wz = (P.y0 + z) * T; ring.push(new THREE.Vector3(wx, heightAt(wx, wz) + 0.12, wz)); }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.85 })); guildGfx.add(line); }
  K.build.setRemote(guildWorld.flatMap((g) => g.build as never));
}
setInterval(() => { const t = performance.now() / 1000; for (const c of guildGfx.children) c.traverse((o) => { if (o.userData.flag) o.rotation.y = Math.sin(t * 1.7 + o.id) * 0.25; }); }, 120);
/* o salão que nasce com a guilda: piso 6×4, paredes com porta, telhado, tochas e bancos (o fundador manda as peças ao servidor uma vez) */
function seedHall(plot: number) { const P = guildPlots.at(plot); if (!P) return []; const out: { kind: string; gx: number; gy: number; v: number }[] = []; const x0 = P.x0 + 2, y0 = P.y0 + 3, W = 6, D = 4;
  for (let y = y0; y < y0 + D; y++) for (let x = x0; x < x0 + W; x++) { const edge = x === x0 || x === x0 + W - 1 || y === y0 || y === y0 + D - 1, door = y === y0 + D - 1 && x === x0 + 2; out.push({ kind: edge ? (door ? 'bdoor' : 'bwall') : 'bfloor', gx: x, gy: y, v: y === y0 || y === y0 + D - 1 ? 0 : 1 }); }
  for (let y = y0; y < y0 + D; y++) for (let x = x0; x < x0 + W; x++) out.push({ kind: 'broof', gx: x, gy: y, v: 0 });
  out.push({ kind: 'torch', gx: x0 + 1, gy: y0 + D + 1, v: 0 }, { kind: 'torch', gx: x0 + 4, gy: y0 + D + 1, v: 0 }, { kind: 'bench', gx: x0 + 6, gy: y0 + D + 2, v: 0 }, { kind: 'campfire', gx: x0 + 3, gy: y0 + D + 3, v: 0 }); return out; }
const CARTA_K = 'karmika.guildcarta';
const social = createSocial({ hub, chars: () => inicio.chars(), toChar: (i, l) => { const who = inicio.chars().find((c) => c.i === i); if (!who) return false;
    if (!who.active) return inicio.mailToSlot(i, { id: 's' + Date.now() + Math.random(), from: l.from, to: who.name, subj: l.subj, text: l.text, att: l.att, cod: 0, t: Date.now() });
    K.mail.send(l.from, l.subj, l.text, l.att as never, 1500); return true; },
  char: () => K.profile?.name ?? '', lvl: () => K.game.st.lvl, gold: () => K.game.st.gold, payGold: (n) => { if (K.game.st.gold < n) return false; buyFxLast('🪙'); K.audio.coins(5); K.game.st.gold -= n; return true; }, log: (t, c) => K.game.logMsg(t, c),
  items: () => Object.keys(K.inv.bag).filter((k) => K.inv.bag[k] > 0 && !isToolId(k) && !ITEMS_TBL[k]?.quest).map((id) => ({ id, n: K.inv.bag[id], name: ITEMS_TBL[id]?.name ?? id, icon: ITEMS_TBL[id]?.icon ?? '•' })),
  gear: () => K.inv.gearBag, takeItem: (id, n) => K.inv.take(id, n), takeGear: (uid) => { const i = K.inv.gearBag.findIndex((g) => g.uid === uid); if (i < 0) return null; const g = K.inv.gearBag.splice(i, 1)[0]; K.inv.save(); K.inv.refresh(); return g; },
  itemName: (id) => ITEMS_TBL[id]?.name ?? id, itemIcon: (id) => ITEMS_TBL[id]?.icon ?? '•', rarityCol: (r) => (RARITY as Record<string, { col: string }>)[r]?.col ?? '#e8dcc0',
  ask: (t, x, y, cb) => K.coop.ask(t, x, y, cb, 40), chatGuild: (from, text, tag) => K.chat.recv(`[${tag}] ${from}`, text, 'guild'), hasTear: () => K.inv.has('lagrima'), useTear: () => { K.inv.take('lagrima', 1); }, seedHall,
  /* a party agora: os outros dois nomes, se eu lidero, e se estão no salão comigo (a menos de FOUND_NEAR_M) */
  partyNow: () => { const P = K.net.party, me = K.net.myId; if (!P) return { inParty: false, leader: false, party: [] }; const my = K.hero.root.position, rs = K.net.remotes();
    return { inParty: true, leader: P.leader === me, party: P.members.filter((id) => id !== me).map((id) => { const r = rs.find((q) => q.id === id); return { name: K.net.nameOf(id), near: !!r && Math.hypot(r.pos.x - my.x, r.pos.z - my.z) <= FOUND_NEAR_M }; }) }; },
  plotText: (plot) => { const P = guildPlots.at(plot), lu = K.city.settlements.find((q) => q.name === 'Lumenhal'); if (!P || !lu) return 'perto de Lumenhal'; const dx = P.x0 + 5 - lu.x, dy = P.y0 + 5 - lu.y, dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'a leste' : 'a oeste') : (dy > 0 ? 'ao sul' : 'ao norte'); return `${dir} de Lumenhal, a ${Math.round(Math.hypot(dx, dy) * T)} m da praça`; },
  markPlot: (plot) => { const P = guildPlots.at(plot); if (!P) return; K.mapV.cx = P.x0 + 5; K.mapV.cy = P.y0 + 5; K.mapV.z = Math.max(K.mapV.z, 4); if (!K.minimapaSys.bigOpen) K.toggleBigMap(); K.game.logMsg('📍 O terreno da guilda está no centro do mapa.', '#ffe08a'); },
  onWorld: (list) => { guildWorld = list; drawGuilds(); if (myGuild && seedPending === myGuild.id) { const g = list.find((q) => q.id === myGuild!.id); if (g && !g.build.length) { for (const b of seedHall(g.plot)) hub.send({ t: 'g:build', b }); } seedPending = 0; } },
  onGuild: (g) => { const was = myGuild; myGuild = g; if (g && !was && g.members.length <= 3 && Date.now() - g.created < 60000 && g.members.some((m) => m.rank === 'lider' && m.name.toLowerCase() === (K.profile?.name ?? '').toLowerCase())) seedPending = g.id; /* 05/11: a guilda nasce com 3 fundadores; quem semeia o salão é o líder */ drawGuilds(); K.updateWho(); } });
let seedPending = 0;
/* 06/11: o que o membro faz no mundo conta para as missões do dia da guilda (o servidor soma, limita e cobra só quem tem guilda) */
const GATHER = new Set(['herbs', 'herb_m', 'trees', 'rocks', 'fish', 'fish_g', 'ore_i', 'ore_ag', 'skins', 'gem', 'hide_f']);
queueMicrotask(() => { K.feats.onBump((k, n) => { if (k === 'kills') social.prog('kill', n); else if (GATHER.has(k)) social.prog('gather', n); }); K.quests.addDoneHook(() => social.prog('quest')); });
if (IS_DEV) Object.assign(window as object, { __carav: () => K.caravans, __perf: () => K.perfReport(), __festa: () => K.festaStatus(), __inicio: () => inicio, __hub: hub, __social: social, __gplots: guildPlots });
addEventListener('keydown', (e) => { if (e.key === 'F9') { e.preventDefault(); social.toggle(); } });
(window as unknown as { __net?: unknown }).__net = K.net;
setTimeout(() => { (window as unknown as { __pvp?: unknown }).__pvp = pvp; (window as unknown as { __mail?: unknown }).__mail = K.mail; }, 0);
/* ===== PvP (jogar junto) — regra do Erling, 22/10/2026 =====
   - Facções DIFERENTES se atacam livremente, sem custo de karma (ninguém é obrigado a lutar).
   - MESMA facção (ou quem ainda não jurou lado) não se fere, a não ser que o atacante LIGUE o "PvP da facção":
     aí o nome dele fica vermelho e cada vítima nova custa karma (−3 no primeiro golpe, −15 se matar).
   - Revidar quem atacou primeiro nunca custa karma. Companheiros de grupo não se ferem. Vila é chão sagrado.
   - Duelo: combinado pelos dois, vale em qualquer lugar, ninguém morre (acaba quando um chega a 10% da vida). */
const pvp = (() => {
  const hostile = new Map<number, number>(); // quem me atacou → até quando posso revidar sem culpa
  const struck = new Map<number, number>(); // quem eu (mesmo lado) já ataquei: o karma só cai no primeiro golpe de cada 2 min
  let duel = 0, duelGo = 0;
  const safeAt = (x: number, z: number) => K.city.settlements.some((s) => Math.hypot(x / T - s.x, z / T - s.y) < s.radius);
  /** os dois são de facções diferentes (e ambos juraram lado)? */
  const rivals = (theirs: string | null) => { const mine = myFac(); return !!mine && !!theirs && mine !== theirs; };
  function hitPlayers(cx: number, cz: number, yaw: number, reach: number, arc: number, n: number, crit: boolean) {
    if (K.net.state !== 'on' || K.inside || K.game.st.dead) return;
    const now = Date.now();
    for (const r of K.net.remotes()) {
      if (r.zn !== 'world') continue;
      const dx = r.pos.x - cx, dz = r.pos.z - cz, dd = Math.hypot(dx, dz); if (dd > reach + 0.45) continue;
      if (arc < Math.PI) { let a = Math.atan2(dx, dz) - yaw; while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; if (dd > 1.2 && Math.abs(a) > arc + 0.25) continue; }
      const isDuel = duel === r.id && now > duelGo;
      if (!isDuel) {
        if (K.net.party?.members.includes(r.id)) continue; // companheiro de grupo não se acerta
        if (safeAt(cx, cz) || safeAt(r.pos.x, r.pos.z)) continue; // vila é chão sagrado
        const revenge = (hostile.get(r.id) ?? 0) > now;
        if (!rivals(r.fac) && !revenge) { // mesmo lado (ou sem facção): só com o PvP da facção ligado, e custa karma
          if (!K.pvpOn) continue;
          if (!((struck.get(r.id) ?? 0) > now)) { K.addKarma(-(3)); K.game.logMsg(`⚔ Você atacou ${r.name}, do seu próprio lado. O karma pesa (−3).`, '#ff8a7a'); }
          struck.set(r.id, now + 120000);
        }
      }
      K.net.x('x:pvp', { to: r.id, n, c: crit ? 1 : 0, d: isDuel ? 1 : 0, x: +cx.toFixed(1), z: +cz.toFixed(1) });
      K.game.dmgText(r.pos.clone().setY(r.pos.y + 2.3), n, crit, isDuel ? '#ffd88a' : '#ff7a6a');
    }
  }
  K.game.setPvp(hitPlayers);
  K.net.onX('x:pvp', (from, m) => {
    if (m.to !== K.net.myId || K.game.st.dead) return;
    const fromPos = new THREE.Vector3(m.x as number, 0, m.z as number), n = m.n as number;
    if (m.d) { if (duel !== from) return; // duelo: ninguém morre
      if (K.game.st.hp - n <= K.game.st.hpMax * 0.1) { K.game.st.hp = Math.max(1, Math.round(K.game.st.hpMax * 0.1)); K.net.x('x:duelend', { w: from, l: K.net.myId }); endDuel(from, false); return; }
      K.game.damage(n, K.hero.root.position, fromPos); return; }
    if (K.inside || safeAt(K.hero.root.position.x, K.hero.root.position.z)) return;
    hostile.set(from, Date.now() + 120000); // agora eu posso revidar sem culpa
    K.game.damage(n, K.hero.root.position, fromPos);
    if (K.game.st.dead) { K.net.x('x:pvpdie', { by: from }); K.quests.grudge(K.net.nameOf(from)); K.game.logMsg(`👁 ${K.net.nameOf(from)} matou você. O Olho viu: um Contrato de Vingança contra essa pessoa não pesa no seu karma.`, '#d9a0d0'); }
  });
  K.net.onX('x:pvpdie', (from, m) => {
    const killer = m.by as number, vn = K.net.nameOf(from), kn = K.net.nameOf(killer);
    if (killer === K.net.myId) {
      const fac = K.net.remotes().find((q) => q.id === from)?.fac ?? null;
      if (rivals(fac)) { K.game.logMsg(`⚔ ${vn}, de ${FAC[fac as Fac]?.name ?? 'outra facção'}, caiu diante de você.`, '#ffd88a'); K.feats.bump('pvp_rival'); }
      else if ((hostile.get(from) ?? 0) > Date.now()) K.game.logMsg(`⚔ ${vn} atacou primeiro e caiu. Foi justiça: o karma não pesa.`, '#ffd88a');
      else { K.addKarma(-(15)); K.game.logMsg(`☠ Você matou ${vn}, do seu próprio lado. O karma pesa (−15).`, '#ff6a5a'); K.feats.bump('pk'); }
      { const k = K.kitRace(); if (k === 'lob' || k === 'vam') { const paid = rivals(fac) || (hostile.get(from) ?? 0) > Date.now() ? 0 : 15; K.game.feed('human'); K.addKarma(-((42 - paid))); K.game.logMsg(`☠ Você se alimentou de ${vn}. Uma alma que vai voltar e lembrar vale o dobro: −42 de karma no total.`, '#ff6a5a'); } }
    } else K.chat.sys(`☠ ${kn} matou ${vn}.`);
  });
  /* duelo */
  function challenge(id: number) { if (K.net.state !== 'on') return; if (duel) { K.game.logMsg('Você já está num duelo.', '#ff9a8a'); return; } K.net.x('x:duelask', { to: id }); K.game.logMsg(`⚔ Desafio enviado a ${K.net.nameOf(id)}.`, '#ffd88a'); }
  K.net.onX('x:duelask', (from, m) => { if (m.to !== K.net.myId) return; if (duel) { K.net.x('x:duelans', { to: from, ok: 0 }); return; }
    K.coop.ask('⚔ Desafio de duelo', `${K.net.nameOf(from)} chama você para um duelo. Ninguém morre: perde quem chegar a 10% da vida.`, 'Aceitar', (ok) => { K.net.x('x:duelans', { to: from, ok: ok ? 1 : 0 }); if (ok) startDuel(from); }); });
  K.net.onX('x:duelans', (from, m) => { if (m.to !== K.net.myId) return; if (m.ok) startDuel(from); else K.game.logMsg(`${K.net.nameOf(from)} recusou o duelo.`, '#b9a890'); });
  function startDuel(id: number) { duel = id; duelGo = Date.now() + 3000; badge('⚔', 'duelo em 3 segundos', `contra ${K.net.nameOf(id)}`, 'join'); K.audio.chime(); }
  function endDuel(winner: number, iWon: boolean) { const other = duel; duel = 0; if (!other) return; const wn = winner === K.net.myId ? 'Você' : K.net.nameOf(winner);
    badge('⚔', 'fim do duelo', `${wn} venceu`, 'join'); K.game.logMsg(iWon ? `⚔ Você venceu o duelo contra ${K.net.nameOf(other)}!` : `⚔ ${wn} venceu o duelo.`, '#ffd88a'); if (iWon) K.feats.bump('duels'); }
  K.net.onX('x:duelend', (from, m) => { if (m.w === K.net.myId && duel === from) endDuel(K.net.myId, true); });
  function toggle() { K.pvpOn = !K.pvpOn; K.net.lookNow(); K.game.logMsg(K.pvpOn ? '⚔ PvP da facção LIGADO: você pode ferir gente do seu lado (e quem não jurou lado). Seu nome fica vermelho e cada ataque pesa no karma.' : '🕊 PvP da facção desligado.', K.pvpOn ? '#ff8a7a' : '#9ad0ff'); }
  return { challenge, hitPlayers, toggle, get on() { return K.pvpOn; }, tick() { if (!duel) return; const r = K.net.remotes().find((q) => q.id === duel); if (!r || r.pos.distanceTo(K.hero.root.position) > 40 || K.game.st.dead) { K.game.logMsg('O duelo terminou: alguém se afastou.', '#b9a890'); duel = 0; } } };
})();
/* tela de boas-vindas: encontrar servidor / abrir servidor / jogar sozinho → escolher um dos 3 personagens → mundo */
let pendingServer: string | null = null;
function joinServer() { const v = pendingServer; pendingServer = null; if (v) { K.net.connect(v); hub.connect(v); } }
/* auras rápidas em volta do herói: poção (vermelho vida, azul magia, âmbar tônico) e comemorações (classe, profissão) */
addEventListener('karmika:drink', (e) => { const k = (e as CustomEvent).detail as string, [c0, c1] = k === 'mp' ? [0xbfe0ff, 0x2a6aff] : k === 'buff' ? [0xffe0a0, 0xff8a2a] : [0xffb0b0, 0xe0202a]; const p = K.hero.root.position;
  for (let i = 0; i < 34; i++) { const a = Math.random() * 6.283, r = 0.35 + Math.random() * 0.4; K.particles.spawn(p.x + Math.cos(a) * r, p.y + 0.1 + Math.random() * 0.6, p.z + Math.sin(a) * r, { vx: Math.cos(a) * 0.4, vy: 1.4 + Math.random() * 1.8, vz: Math.sin(a) * 0.4, life: 0.8 + Math.random() * 0.4, s0: 0.22, s1: 0.03, c0, c1, a: 0.95, drag: 1.5 }); } });
addEventListener('karmika:burst', (e) => { const d = (e as CustomEvent).detail as { c0: number; c1: number; n: number; small?: boolean }, p = K.hero.root.position;
  for (let i = 0; i < d.n; i++) { const a = i / d.n * 6.283, sp = d.small ? 1.2 : 2.6; K.particles.spawn(p.x + Math.cos(a) * 0.3, p.y + (d.small ? 1.0 : 0.3) + Math.random() * 0.4, p.z + Math.sin(a) * 0.3, { vx: Math.cos(a) * sp, vy: (d.small ? 0.6 : 2.2) + Math.random(), vz: Math.sin(a) * sp, life: d.small ? 0.8 : 1.4, s0: d.small ? 0.16 : 0.3, s1: 0.03, c0: d.c0, c1: d.c1, a: 1, drag: 1.2 }); } });
/* a tela de abertura sai quando o mundo e a tela de boas-vindas já estão de pé */
function hideBoot() { const b = document.getElementById('boot'); if (!b || b.classList.contains('off')) return; b.classList.add('off'); setTimeout(() => b.remove(), 700); }
let bootFrames = 0; setTimeout(hideBoot, 30000); // segurança: nunca fica preso na abertura
const inicio = createInicio({ onServer: (sv) => hub.connect(sv), social: () => social.toggle(true), shop: () => K.loja.toggle('prem'), hasChar: () => !!K.profile, desk: (window as unknown as { karmikaDesktop?: never }).karmikaDesktop ?? null,
  onPlay: (server, isNew) => { pendingServer = server; if (isNew || !K.profile) K.showCreate(); /* direto: antes a vila aparecia por um instante entre o menu e a criação (Erling, 26/10) */ else K.withFade(() => { K.objs.update(K.state.fx * T, K.state.fy * T, true); joinServer(); }, server ? 'Entrando no servidor…' : 'Entrando em Karmika…', () => setTimeout(K.resumeSoul, 300)); },
  fresh: async () => K.profile ? { lvl: K.game.st.lvl, cls: K.classOfRace(K.state.race), pic: await slotPic() } : null });
/** retrato pequeno (96×120) do herói carregado, para o card do personagem */
function slotPic(): Promise<string | null> { return new Promise((res) => { try { if (K.humanSkinKey() && !K.peleSys.skinModel) { res(null); return; } /* o modelo do artista ainda não chegou: fica a foto anterior */ const c = heroCard(K.hero.root); if (!c) { res(null); return; } c.then(res, () => res(null)); } catch { res(null); } }); }
/** retrato do Caminhante para a tela de personagens (25/10): estúdio próprio — luz de frente, contraluz, cores em sRGB,
 *  fundo de pergaminho escuro com brilho dourado e sombra no chão. Antes saía escuro e indecifrável (render target linear, sem fundo). */
function heroCard(root: THREE.Object3D): Promise<string | null> | null {
  const W = 264, H = 330, S = 2, rw = W * S, rh = H * S, rt = new THREE.WebGLRenderTarget(rw, rh); rt.texture.colorSpace = THREE.SRGBColorSpace;
  const ps = new THREE.Scene(); ps.environment = K.scene.environment;
  ps.add(new THREE.HemisphereLight(0xfff2dc, 0x6a5a50, 4.2)); ps.add(new THREE.AmbientLight(0xffffff, 1.4));
  const key = new THREE.DirectionalLight(0xfff0d8, 5.2); key.position.set(1.6, 2.6, 3.2); ps.add(key);
  const fill = new THREE.DirectionalLight(0xc8d8ff, 1.1); fill.position.set(-2.4, 1.2, 1.6); ps.add(fill);
  const rim = new THREE.DirectionalLight(0xffd8a0, 2.4); rim.position.set(-1.2, 2.2, -3); ps.add(rim);
  const parent = root.parent, pos = root.position.clone(), rot = root.rotation.clone(), vis = root.visible;
  ps.add(root); root.position.set(0, 0, 0); root.rotation.set(0, 0.38, 0); root.visible = true; root.updateMatrixWorld(true);
  const xr: THREE.Object3D[] = []; root.traverse((o) => { const mt = (o as THREE.Mesh).material as THREE.Material | undefined; if (o.visible && (o.userData.xray || (mt && !Array.isArray(mt) && mt.depthTest === false) || (o as THREE.Sprite).isSprite)) { xr.push(o); o.visible = false; } });
  const box = new THREE.Box3().setFromObject(root), top = Math.min(box.max.y, 2.05 * (root.scale.y || 1)), cy = top * 0.5;
  const cam = new THREE.PerspectiveCamera(26, W / H, 0.05, 40), dist = (top * 0.56) / Math.tan((26 / 2) * Math.PI / 180) + 0.3; cam.position.set(0.25, cy + 0.12, dist); cam.lookAt(0, cy, 0); cam.layers.enableAll();
  const bgc = new THREE.Color(); K.renderer.getClearColor(bgc); const alpha = K.renderer.getClearAlpha(), sm = K.renderer.shadowMap.autoUpdate;
  K.renderer.shadowMap.autoUpdate = false; K.renderer.setRenderTarget(rt); K.renderer.setClearColor(0x000000, 0); K.renderer.clear(); K.renderer.render(ps, cam);
  K.renderer.setRenderTarget(null); K.renderer.setClearColor(bgc, alpha); K.renderer.shadowMap.autoUpdate = sm;
  for (const o of xr) o.visible = true; ps.remove(root); if (parent) parent.add(root); root.position.copy(pos); root.rotation.copy(rot); root.visible = vis;
  /* 03/11 (Erling: "não quero que o jogo trave quando passa de level"): os pixels voltam da placa SEM parar o quadro (leitura assíncrona);
     o resto (fundo, moldura, JPEG) é feito quando chegam */
  const px = new Uint8Array(rw * rh * 4), R = K.renderer as THREE.WebGLRenderer & { readRenderTargetPixelsAsync?: (rt: THREE.WebGLRenderTarget, x: number, y: number, w: number, h: number, b: Uint8Array) => Promise<unknown> };
  const read: Promise<unknown> = R.readRenderTargetPixelsAsync ? R.readRenderTargetPixelsAsync(rt, 0, 0, rw, rh, px) : Promise.resolve(R.readRenderTargetPixels(rt, 0, 0, rw, rh, px));
  return read.then(() => { rt.dispose(); return cardFinish(px, rw, rh, W, H, top, cy); }, () => { rt.dispose(); return null; });
}
function cardFinish(px: Uint8Array, rw: number, rh: number, W: number, H: number, top: number, cy: number): string | null {
  let any = 0; for (let i = 3; i < px.length; i += 16) if (px[i] > 0) any++; if (any < 50) return null;
  const flip = document.createElement('canvas'); flip.width = rw; flip.height = rh; flip.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(px.buffer as ArrayBuffer), rw, rh), 0, 0);
  const fig = document.createElement('canvas'); fig.width = rw; fig.height = rh; const fg = fig.getContext('2d')!; fg.translate(0, rh); fg.scale(1, -1); fg.drawImage(flip, 0, 0); /* a placa lê de baixo para cima */
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d')!;
  const bg = g.createRadialGradient(W / 2, H * 0.42, 10, W / 2, H * 0.5, H * 0.75); bg.addColorStop(0, '#5a4226'); bg.addColorStop(0.45, '#2a1e14'); bg.addColorStop(1, '#0c0806'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.18; g.strokeStyle = '#e0b45a'; g.lineWidth = 1; for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(W / 2, H * 0.4, 30 + k * 26, 0, Math.PI * 2); g.stroke(); } g.globalAlpha = 1;
  const fy = H * 0.5 + (cy - 0) / (top * 1.12) * H * 0.5; const sh = g.createRadialGradient(W / 2, fy, 2, W / 2, fy, W * 0.32); sh.addColorStop(0, 'rgba(0,0,0,.55)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.save(); g.translate(0, fy); g.scale(1, 0.22); g.translate(0, -fy); g.fillStyle = sh; g.fillRect(0, fy - W * 0.4, W, W * 0.8); g.restore();
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.shadowColor = 'rgba(255,214,150,.35)'; g.shadowBlur = 10; g.drawImage(fig, 0, 0, W, H); g.shadowBlur = 0;
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(224,180,90,.55)'; g.lineWidth = 2; g.strokeRect(5, 5, W - 10, H - 10);
  return cv.toDataURL('image/jpeg', 0.86);
}
/* o retrato do cartão lê pixels da placa (trava o quadro): só tira de novo quando muda nível, classe ou a cada 5 min, não a cada 20 s */
let picKey = '', picAt = 0, celebAt = 0;
addEventListener('karmika:celebrate', () => { celebAt = performance.now(); });
function saveSlotMeta() { if (!K.profile || inicio.isOpen || K.peleSys.creating) return;
  const pk = `${K.game.st.lvl}|${(document.getElementById('who')?.textContent || '').trim()}`;
  /* WebGPU: a foto sai por um WebGL à parte, que monta o herói do zero (meio segundo parado). Então só tira quando muda nível ou classe —
     não na primeira gravação (fica a foto que já estava no cartão) nem a cada 5 min */
  if (gpuState.on && !picKey) picKey = pk;
  /* a foto espera a festa acabar: nada de tirar retrato no meio do pilar de luz da subida de nível ou de uma luta */
  const busy = performance.now() - celebAt < 12000 || !!K.hero.combat;
  const needPic = !busy && (pk !== picKey || (!gpuState.on && performance.now() - picAt > 300000)); if (needPic) { picKey = pk; picAt = performance.now(); }
  (needPic ? slotPic() : Promise.resolve(null)).then((pic) => { if (K.profile) inicio.saveMeta({ name: K.profile.name, lvl: K.game.st.lvl, cls: (document.getElementById('who')?.textContent || '').trim(), origin: K.profile.origin, sex: K.profile.sex ?? 'm', pic, server: K.net.state === 'on' ? `karmika://${K.net.address}/${K.net.code}` : null }); }); }
setInterval(saveSlotMeta, 20000); addEventListener('beforeunload', () => { if (K.profile && !inicio.isOpen) inicio.saveMeta({ name: K.profile.name, lvl: K.game.st.lvl, cls: (document.getElementById('who')?.textContent || '').trim(), origin: K.profile.origin, sex: K.profile.sex ?? 'm', pic: null, server: null }); });
/* balão de fala sobre o herói */
const bubbleEl = document.createElement('div'); bubbleEl.className = 'bubble'; document.body.appendChild(bubbleEl); let bubbleT = 0;
function bubble(text: string) { bubbleEl.textContent = text; bubbleT = 4.5; bubbleEl.style.display = 'block'; }
  return { slotPic, inicio, social, useDeed, otherHouses, guildZoneAt, hub, deedItemOf, bubble, pvp, get myGuild() { return myGuild; }, CARTA_K, otherDecor, saveSlotMeta, joinServer, get pendingServer() { return pendingServer; }, get bootFrames() { return bootFrames; }, set bootFrames(v: typeof bootFrames) { bootFrames = v; }, hideBoot, get bubbleT() { return bubbleT; }, set bubbleT(v: typeof bubbleT) { bubbleT = v; }, bubbleEl };
}
