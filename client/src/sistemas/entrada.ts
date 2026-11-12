/* ENTRADA: teclado (atalhos, movimento, combate, janelas), mira e o estado das teclas. Saiu do main.ts (02/11). */
import { isAdm } from './admin';
import { t as tr } from '../i18n';
import * as THREE from 'three';
import { TILE_M as T, type Race } from '@karmika/shared';
import { createAim, type AimSpec } from '../aim';
import { type SkillDef, skillAt, setBarRows, barRows, layout, posKey } from '../kits';
import { heightAt } from '../world';
import type { EntradaCtx } from '../main';

export function createEntrada(K: EntradaCtx) {
/* 06/11: runas que fazem sumir e reaparecer atrás do alvo — só em chão livre; se o lugar estiver ocupado, aproxima até achar */
K.game.setTeleport((x, z) => { const hx = K.hero.root.position.x, hz = K.hero.root.position.z; let tx = x, tz = z, k = 0; for (; k < 10 && !K.free(tx / T, tz / T); k++) { tx = hx + (tx - hx) * 0.85; tz = hz + (tz - hz) * 0.85; } if (!K.free(tx / T, tz / T)) return false;
  K.state.fx = tx / T; K.state.fy = tz / T; K.state.path = []; K.hero.root.position.x = tx; K.hero.root.position.z = tz; K.game.blinkArrive?.(); return true; });
/* ---------- entrada ---------- */
const keys = new Set<string>();
/* R alterna correr/andar (padrão: correr, gasta fôlego); Shift segurado faz o contrário enquanto estiver pressionado.
   Sem fôlego, anda sozinho até recuperar 25% */
let runOn = (() => { try { return localStorage.getItem('karmika.run') !== '0'; } catch { return true; } })(), outOfBreath = false;
const runningNow = () => (runOn !== keys.has('shift')) && !outOfBreath;
const heroPosNow = () => new THREE.Vector3(K.state.fx * T, 0, K.state.fy * T);
/* ---- marcação de chão: a magia marca, o botão direito lança no local marcado ---- */
const aim = createAim(K.scene);
const GUARD_AIM: AimSpec = { kind: 'cone', radius: 2.8, range: 2.8, arc: 1.6, color: 0x9ad7ff };
let aimSlot: string | null = null, lockYaw: number | null = null, guardCone = false;
let leap: { x0: number; z0: number; x1: number; z1: number } | null = null;
/* ---- modo de combate (Tab): fora dele corre-se mais rápido, o escudo vai às costas e as mãos ficam livres para o ofício ---- */
let combatMode = false;
/* 04/11 Salto de Recuo (elfo) — 10/11 (Erling: "quando uso a magia 3 ele tem que pular para trás e ir DE VERDADE para trás, pousar umas 6
   células ou mais longe do inimigo"): 12 m para trás, sem virar as costas, subindo ~1,8 m no meio; a flecha sai no ar. Vale tanto mirado
   quanto lançado direto pelo atalho (antes, pelo atalho, só tocava a animação e ficava no lugar). */
function backleap(yaw: number, cost: number): boolean {
  const hp = K.hero.root.position, hx = hp.x, hz = hp.z, bx = -Math.sin(yaw), bz = -Math.cos(yaw); let tx = hx + bx * 12, tz = hz + bz * 12;
  for (let k = 0; k < 16 && !K.free(tx / T, tz / T); k++) { tx = hx + (tx - hx) * 0.88; tz = hz + (tz - hz) * 0.88; }
  const ok = K.game.useExtra('backleap', yaw, cost, { x: tx, z: tz }); if (!ok) return false;
  K.state.path = []; const x0 = hx, z0 = hz, t0 = performance.now(), D = 650;
  const step = () => { const k = Math.min(1, (performance.now() - t0) / D), e = 1 - (1 - k) * (1 - k); const x = x0 + (tx - x0) * e, z = z0 + (tz - z0) * e; K.hero.root.position.x = x; K.hero.root.position.z = z; K.state.fx = x / T; K.state.fy = z / T; K.hero.lift = Math.sin(Math.PI * k) * 1.8; if (k < 1) requestAnimationFrame(step); else K.hero.lift = 0; };
  requestAnimationFrame(step); return true;
}

function setCombat(on: boolean, quiet = false) {
  if (combatMode === on) return; combatMode = on; K.hero.combat = on;
  document.body.classList.toggle('combat', on);
  if (!quiet) K.game.logMsg(on ? '⚔ Modo de combate' : '🌿 Modo pacífico: +20% de velocidade, profissões liberadas', on ? '#ffd24a' : '#9ad7a0');
  if (!on) { cancelAim(); K.game.guard(false); guardCone = false; aim.hide(); }
}
const locked = (sk: SkillDef) => { if (!K.tree.has(sk.id)) { K.game.logMsg(`${sk.name}: aprenda na Árvore Kármica (K).`, '#ff9a8a'); if (K.tree.available() > 0) K.dockEl.querySelector('[data-d="skills"]')?.classList.add('pulse'); return true; } return false; };
function startAim(slot: string) {
  const sk = skillAt(K.kitRace(), slot); if (!sk?.aim) return false;
  /* 10/11 (Erling: "magia de mira, se eu clicar duas vezes ela vai sozinha num bicho, nunca erra no vazio"): apertar de novo com a mira
     aberta lança no inimigo mais perto dentro do alcance (empate: o mais perto do mouse). Sem inimigo no alcance, só fecha a mira. */
  if (aimSlot === slot) { if (!autoFire(slot, sk)) { cancelAim(); K.game.logMsg(tr('mira.sem_alvo', { magia: sk.name }), '#c8c0a8'); } return true; }
  if (locked(sk)) return true;
  const sc = K.tree.scale(sk.id); setCombat(true); aimSlot = slot; guardCone = false; aim.show({ ...sk.aim, radius: sk.aim.radius * sc.area, range: sk.aim.range * sc.range, label: sk.name }); document.querySelector(`.slot[data-k="${slot}"]`)?.classList.add('aim');
  return true;
}
function autoFire(slot: string, sk: SkillDef): boolean {
  const hx = K.state.fx * T, hz = K.state.fy * T, range = sk.aim!.range * K.tree.scale(sk.id).range;
  let best: { x: number; z: number } | null = null, bs = Infinity;
  for (const e of K.game.enemies.list) { if (!e.active || !e.alive || e.def.passive) continue; const d = Math.hypot(e.pos.x - hx, e.pos.z - hz); if (d > range + 0.5) continue;
    const s = d + Math.hypot(e.pos.x - K.mouse.x, e.pos.z - K.mouse.z) * 0.15; if (s < bs) { bs = s; best = e.pos; } }
  if (!best) return false;
  const at = { x: best.x, z: best.z, yaw: Math.atan2(best.x - hx, best.z - hz) };
  cancelAim();
  if (!castAt(slot, at)) { if (K.game.ready(sk.id, sk.cost) === null) castQ = { slot, at, until: performance.now() + 650 }; }
  return true;
}
function cancelAim() { if (aimSlot) document.querySelector(`.slot[data-k="${aimSlot}"]`)?.classList.remove('aim'); aimSlot = null; if (!guardCone) aim.hide(); }
function fireAim() {
  if (!aimSlot) return;
  const hx = K.state.fx * T, hz = K.state.fy * T, a = aim.update(0, hx, hz, K.mouse.x, K.mouse.z, (x, z) => K.inside ? 0 : heightAt(x, z));
  const slot = aimSlot, at = { x: a.x, z: a.z, yaw: a.yaw };
  cancelAim();
  if (!castAt(slot, at)) { const sk = skillAt(K.kitRace(), slot); if (sk && K.game.ready(sk.id, sk.cost) === null) castQ = { slot, at, until: performance.now() + 650 }; /* o herói estava no meio de outro gesto: a magia sai assim que ele termina */ }
}
/** lança a magia de mira no ponto marcado; false se não pôde sair agora */
function castAt(slot: string, a: { x: number; z: number; yaw: number }) {
  const hx = K.state.fx * T, hz = K.state.fy * T;
  const sk = skillAt(K.kitRace(), slot); if (!sk) return false; const yaw = a.yaw; let ok = false;
  if (sk.id === 'slam') {
    if (K.state.race === 'nordic' || K.state.race === 'dwarf') {
      // ponto de pouso: encurta até cair em chão livre
      let tx = a.x, tz = a.z; for (let k = 0; k < 12 && !K.free(tx / T, tz / T); k++) { tx = hx + (tx - hx) * 0.85; tz = hz + (tz - hz) * 0.85; }
      ok = K.game.slam({ x: tx, z: tz }); if (ok) leap = { x0: hx, z0: hz, x1: tx, z1: tz };
    } else ok = K.game.cast(yaw, { x: a.x, z: a.z });
  } else if (sk.id === 'pounce') { // Salto da Fera: o mesmo arco do salto marcado
    let tx = a.x, tz = a.z; for (let k = 0; k < 12 && !K.free(tx / T, tz / T); k++) { tx = hx + (tx - hx) * 0.85; tz = hz + (tz - hz) * 0.85; }
    ok = K.game.useExtra('pounce', yaw, sk.cost, { x: tx, z: tz }); if (ok) leap = { x0: hx, z0: hz, x1: tx, z1: tz };
  } else if (sk.id === 'backleap') { ok = backleap(yaw, sk.cost); // Salto de Recuo: ver backleap()
  } else if (sk.id === 'blink' || sk.id === 'leafstep') { // Piscar / Passo Sombrio / Folha ao Vento: some e reaparece à frente, em chão livre
    const dl = Math.min((sk.id === 'leafstep' ? 10 : 8) * 1, Math.hypot(a.x - hx, a.z - hz) || 8), dx = Math.sin(yaw), dz = Math.cos(yaw); let tx = hx + dx * dl, tz = hz + dz * dl; for (let k = 0; k < 14 && !K.free(tx / T, tz / T); k++) { tx = hx + (tx - hx) * 0.85; tz = hz + (tz - hz) * 0.85; }
    ok = K.game.useExtra(sk.id, yaw, sk.cost, { x: tx, z: tz }); if (ok) { K.state.fx = tx / T; K.state.fy = tz / T; K.state.path = []; K.hero.root.position.x = tx; K.hero.root.position.z = tz; K.game.blinkArrive?.(); }
  } else if (sk.id === 'bash') ok = K.game.bash(yaw, { x: a.x, z: a.z });
  else if (sk.id === 'heal') ok = K.game.heal(heroPosNow(), { x: a.x, z: a.z });
  else ok = K.game.useExtra(sk.id, yaw, sk.cost, { x: a.x, z: a.z });
  if (ok) { lockYaw = yaw; lockFresh = true; castQ = null; }
  return ok;
}
let lockFresh = false, lastActN: string | null = null, lastActP = 0;
let castQ: { slot: string; at: { x: number; z: number; yaw: number }; until: number } | null = null, aimKey: string | null = null, denyT = 0;
/** sem recurso ou recarregando: nem desenha a mira; avisa uma vez e pisca a barra */
function denySkill(sk: SkillDef, why: 'cd' | 'res') {
  K.audio.error(); const el = document.querySelector(`.slot[data-k="${sk.k}"]`) as HTMLElement | null; el?.animate([{ filter: 'brightness(2.2) saturate(0.2)' }, { filter: 'none' }], 260);
  if (why === 'res') document.getElementById('mp')?.animate([{ filter: 'brightness(2)' }, { filter: 'none' }], 250);
  const now = performance.now(); if (now - denyT < 900) return; denyT = now;
  K.game.logMsg(why === 'res' ? `${sk.name}: falta ${K.game.st.res.name}.` : `${sk.name}: ainda recarregando.`, why === 'res' ? '#ff9a8a' : '#c8c0a8');
}
/** aperta um botão da barra (tecla 1-9,0) */
function useSlot(k: string, fromKey = false) {
  const sk = skillAt(K.kitRace(), k); if (!sk) return;
  if (locked(sk)) return;
  if (sk.id === 'guard') { setCombat(true); K.game.guard(true); if (K.hero.guard && !aimSlot) { guardCone = true; aim.show(GUARD_AIM); } return; }
  { const why = K.game.ready(sk.id, sk.cost); if (why && aimSlot !== k) { denySkill(sk, why); return; } }
  if (sk.aim) { startAim(k); if (fromKey && aimSlot === k) aimKey = k; return; }
  setCombat(true);
  if (sk.id === 'combo') K.game.attack(aimYaw(), heroPosNow());
  else if (sk.id === 'slam') K.game.cast(aimYaw());
  else if (sk.id === 'bash') K.game.bash();
  else if (sk.id === 'heal') K.game.heal(heroPosNow());
  else if (sk.id === 'backleap') backleap(aimYaw(), sk.cost);
  else K.game.useExtra(sk.id, aimYaw(), sk.cost);
}
/* o ataque vai para onde o mouse aponta; se houver inimigo nesse cone, encaixa no mais próximo (empate → mais forte) */
/** em combate, parado: o herói encara o inimigo mais próximo (até 7 m) */
const nearYaw = (): number | null => { const hx = K.state.fx * T, hz = K.state.fy * T; let b: { x: number; z: number } | null = null, bd = 7; for (const e of K.game.enemies.list) { if (!e.active || !e.alive || e.def.passive) continue; const d = Math.hypot(e.pos.x - hx, e.pos.z - hz); if (d < bd) { bd = d; b = e.pos; } } return b ? Math.atan2(b.x - hx, b.z - hz) : null; };
const aimYaw = () => {
  const hx = K.state.fx * T, hz = K.state.fy * T, my = Math.atan2(K.mouse.x - hx, K.mouse.z - hz), tg = K.game.target(new THREE.Vector3(hx, 0, hz), my);
  return tg ? Math.atan2(tg.x - hx, tg.z - hz) : my;
};
const tapAt: Record<string, number> = {};
const DIRK: Record<string, [number, number]> = { w: [0, -1], arrowup: [0, -1], s: [0, 1], arrowdown: [0, 1], a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0] };
const worldDir = (ix: number, iy: number): [number, number] => { const x = ix * Math.cos(K.az) - iy * -Math.sin(K.az), y = -ix * Math.sin(K.az) - iy * -Math.cos(K.az); const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
function startDash(gx: number, gy: number) {
  if (K.game.menuOpen || K.dlg.isOpen || K.dashCd > 0 || K.game.st.dead) return;
  if (K.game.st.stam < 15 && !K.game.st.god) { K.game.logMsg('Sem fôlego para o dash.', '#ffd24a'); return; }
  if (!K.game.st.god && !K.game.st.sp.has('u_sleipnir')) K.game.st.stam -= 15;
  if (K.game.st.sp.has('u_sleipnir') || K.game.st.sp.has('r_pena')) { const hp0 = K.hero.root.position, wing = K.game.st.sp.has('r_pena'); for (let i = 0; i < 30; i++) { const s2 = i % 2 ? 1 : -1, k = (i >> 1) / 15; K.particles.spawn(hp0.x - gx * k * 1.5 + gy * s2 * (wing ? 0.4 + k * 1.2 : 0.2), 1.2 + (wing ? Math.sin(k * Math.PI) * 0.8 : -0.9), hp0.z - gy * k * 1.5 - gx * s2 * (wing ? 0.4 + k * 1.2 : 0.2), { vy: 0.3, life: 0.6, s0: 0.3, s1: 0.04, c0: 0xffffff, c1: wing ? 0xfff0d0 : 0xcfe0ff, a: 0.9 }); } }
  K.dashT = 0.2; K.dashCd = 0.7; K.audio.dash(); K.hero.act('dash'); K.game.ambush(); K.dx0 = gx; K.dy0 = gy;
}
// slots da barra: clicáveis; a guarda segura enquanto o botão estiver pressionado
/* a interface nunca rola: um clique que dá foco a algo fora da tela (ou um atalho) podia empurrar a barra uma linha para baixo */
addEventListener('scroll', (e) => { const t = e.target as Element | Document; if (t === document || t === document.documentElement || t === document.body) { if (scrollX || scrollY) scrollTo(0, 0); } else if (t instanceof HTMLElement && t.closest('#bar,#hud,#quick')) { t.scrollTop = 0; t.scrollLeft = 0; } }, true);
/* barra travada: arrastar uma magia avisa onde destravar */
{ let dn: { x: number; y: number } | null = null, told = 0;
  document.getElementById('skills')!.addEventListener('pointerdown', (e) => { if ((e.target as HTMLElement).closest('.slot:not(.empty)') && document.documentElement.dataset.barEdit !== '1') dn = { x: e.clientX, y: e.clientY }; }, true);
  addEventListener('pointermove', (e) => { if (!dn) return; if (Math.hypot(e.clientX - dn.x, e.clientY - dn.y) > 10) { dn = null; if (performance.now() - told > 4000) { told = performance.now(); K.game.logMsg('🔒 A barra está travada. Clique no cadeado (canto inferior esquerdo da barra) para mover as magias.', '#ffe08a'); document.querySelector('.barlock')?.classList.add('ping'); setTimeout(() => document.querySelector('.barlock')?.classList.remove('ping'), 1600); } } });
  addEventListener('pointerup', () => { dn = null; }); }
{ const bar = document.getElementById('skills')!;
  bar.addEventListener('pointerdown', (e) => { const rb = (e.target as HTMLElement).closest('button[data-rows]') as HTMLElement | null; if (rb) { e.preventDefault(); e.stopPropagation(); setBarRows(barRows() + (rb.dataset.rows === '+' ? 1 : -1)); K.applyKitAll(); K.game.logMsg(`Barra de magias: ${barRows()} andar${barRows() > 1 ? 'es' : ''}.`, '#b9c6e0'); return; } const el = (e.target as HTMLElement).closest('.slot') as HTMLElement | null; if (!el || el.classList.contains('empty')) return; if (document.documentElement.dataset.barEdit === '1') return; /* destravada: só arrasta */ e.preventDefault(); e.stopPropagation(); K.audio.start(); useSlot(el.dataset.k!); });
  const up = () => { if (K.hero.guard) { K.game.guard(false); guardCone = false; if (!aimSlot) aim.hide(); } };
  bar.addEventListener('pointerup', up); bar.addEventListener('pointerleave', up); }
for (const id of ['bar', 'mini', 'menu', 'inv', 'shop', 'bigmap']) document.getElementById(id)?.addEventListener('contextmenu', (e) => e.preventDefault());
const ORDER: Race[] = ['nordic', 'technocrat', 'dwarf'];
function swapTo(r: Race) { if (r !== K.state.race) { K.state.race = r; K.swapHero(); K.game.setClassName(K.classOfRace(r)); } }
addEventListener('keyup', (e) => {
  /* magia de mira: segurar a tecla mostra o desenho no chão; soltar lança (toque rápido = lança na hora, onde o mouse está) */
  if (aimKey) { const k = e.key.toLowerCase(), slot = e.shiftKey && /^Digit[0-9]$/.test(e.code) ? '⇧' + e.code.slice(5) : k === 'j' ? '1' : k === 'q' ? '4' : /^[0-9]$/.test(k) ? k : null;
    if (slot && (slot === aimKey || slot === aimKey.replace('⇧', ''))) { const was = aimKey; aimKey = null; if (aimSlot === was) fireAim(); } }
});
/** solta a guarda: pela tecla do espaço dela em qualquer andar (⇧/⌃ também soltam) — antes só funcionava no 1º andar e o herói ficava travado em guarda */
addEventListener('keyup', (e) => {
  if (!K.hero.guard) return; const L = layout(K.kitRace()); const p = L.findIndex((d) => d?.id === 'guard'); const gk = p >= 0 ? posKey(p) : '';
  const dig = /^Digit([0-9])$/.exec(e.code)?.[1], k = e.key.toLowerCase();
  const hit = k === 'shift' || k === 'control' || (dig !== undefined && gk.endsWith(dig)) || (k === 'q' && gk === '4');
  if (hit) { K.game.guard(false); guardCone = false; if (!aimSlot) aim.hide(); }
});
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (K.cinemaSys.cine) { if (e.key === 'Escape' && (K.cinemaSys.cine.sc.skippable || K.cinemaSys.cine.skipOk)) K.endScene(); e.preventDefault(); return; }
  if (K.chat.isOpen || K.inicio.isOpen || K.peleSys.creating) return;
  { const tg = e.target as HTMLElement | null; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || tg.isContentEditable)) return; } /* digitando num campo: nada vaza para o personagem */
  /* 09/11 (Erling: "F4 é atalho de poção mas chama a tela de party também"): o grupo agora abre com Shift+F4; F4 sozinho é só a barra de poções */
  if (e.key === 'F4' && e.shiftKey) { e.preventDefault(); keys.clear(); K.coop.toggle(); return; }
  if (e.key === 'Enter' && !K.inv.isOpen && !K.dlg.isOpen && !K.quests.isOpen) { e.preventDefault(); keys.clear(); K.chat.open(); return; }
  if (e.key === 'Tab') e.preventDefault();
  if (e.key === 'Escape') { if (aimSlot) { cancelAim(); return; } if (K.stable.isOpen) { K.stable.toggle(false); return; } if (K.align.isOpen) { K.align.toggle(false); return; } if (K.dockSys.skillsOpen || K.dockSys.featsOpen) { K.toggleSkills(false); K.toggleFeats(false); return; } if (K.build.on) { K.build.toggle(false); return; } if (K.reliquiasSys.relicOpen) { K.closeRelics(); return; } if (K.olhoSys.olhoOpen) { K.toggleOlho(false); return; } if (K.dlg.isOpen) { K.dlg.close(); return; } if (K.quests.isOpen) { K.quests.closeAll(); return; } if (K.vid.isOpen) { K.vid.close(); return; } if (K.mail.isOpen) { K.mail.close(); return; } if (K.profs.isOpen) { K.profs.close(); return; } if (K.loja.isOpen) { K.loja.close(); return; } if (K.minimapaSys.bigOpen) { K.toggleBigMap(); return; } if (K.inv.isOpen) { K.inv.closeAll(); return; } K.game.toggleMenu(); return; }
  if (K.game.menuOpen) return;
  if (k === 'i') { keys.clear(); K.inv.toggle(); return; }
  if (k === 'j') { keys.clear(); K.quests.toggleLog(); return; }
  if (k === 'y') { keys.clear(); K.profs.toggle(); return; }
  if (k === 't') { keys.clear(); K.loja.toggle(); return; }
  if (k === 'c') { keys.clear(); K.inv.toggleChar(); return; }
  if (k === 'u') { keys.clear(); K.compendium.toggle(); return; }
  if (k === 'k') { keys.clear(); K.toggleSkills(); return; }
  if (k === 'l') { keys.clear(); K.toggleFeats(); return; }
  if (k === 'b') { if (K.inside) { K.game.logMsg('Construa do lado de fora.', '#ff9a8a'); return; } if (combatMode) setCombat(false); K.build.toggle(); return; }
  if (k === 'r' && K.build.on) { K.build.rotate(); return; }
  if (k === 'z') { if (!K.compSys.mount) { if (K.stable.mountId) return; K.game.logMsg('Você não tem montaria. Procure Orm, o Estalajadeiro.', '#ff9a8a'); return; } if (!K.compSys.riding && (combatMode || K.inside || K.swimmingNow)) { K.game.logMsg(combatMode ? 'Saia do modo de combate (Tab) para montar.' : 'Não dá para montar aqui.', '#ff9a8a'); return; } K.setRiding(!K.compSys.riding); return; }
  if (K.dlg.isOpen) return;
  if (e.shiftKey && /^Digit[0-9]$/.test(e.code)) { if (!e.repeat) useSlot('⇧' + e.code.slice(5), true); return; } // 2º andar da barra: ⇧1–⇧0
  keys.add(k); /* com janelas abertas ainda dá para andar, lutar e usar a barra */
  if (!e.repeat && DIRK[k]) { // duplo toque em W/A/S/D (ou setas) = dash naquela direção
    const nowMs = performance.now();
    if (nowMs - (tapAt[k] ?? -1e9) < 260) { const [ix, iy] = DIRK[k]; const [gx, gy] = worldDir(ix, iy); startDash(gx, gy); tapAt[k] = -1e9; } else tapAt[k] = nowMs;
  }
  if (k === '6') { const f = K.hero.facing; startDash(K.state.moving ? K.dx0 || Math.sin(f) : Math.sin(f), K.state.moving ? K.dy0 || Math.cos(f) : Math.cos(f)); }
  if (k === 'k') { keys.clear(); K.toggleSkills(); return; }
  if (k === 'l') { keys.clear(); K.toggleFeats(); return; }
  if (k === 'm') K.toggleBigMap();
  if (k === 'o') K.audio.toggleMute();
  if (k === 'x') { K.stable.toggle(); return; }
  if (k === 'p') K.game.logMsg(K.audio.toggleMusic() ? '🎵 Música ligada' : '🎵 Música desligada', '#b9c6e0');
  /* 12/11 (Erling: "o jogador não pode controlar o dia e a noite: isso mexe com o dia e a noite de todos, com o passar do tempo e com os turnos"): a tecla N saiu de vez. O relógio do mundo é um só. */
  if (/^[0-9]$/.test(k) && !e.repeat) useSlot(k, true); else if (/^[0-9]$/.test(k) && skillAt(K.kitRace(), k)?.id === 'combo') useSlot(k);
  if (k === 'j' && !e.repeat) useSlot('1', true);
  if (k === 'q' && !e.repeat) useSlot('4', true);
  if (k === 'f' && !e.repeat && !e.ctrlKey && !e.metaKey) K.toggleInstinct();
  if (k === 'v' && !e.repeat && !e.ctrlKey && !e.metaKey) { K.instintoSys.stanceSys?.cycle(); K.renderStances(); }
  if (k === 'e') K.interact();
  if (k === 'e' && !e.repeat) { eDown = performance.now(); eRot = false; }
  if (k === 'g' && isAdm()) { K.game.st.god = !K.game.st.god; K.ZOOM_MAX = K.game.st.god ? 95 : 22; if (!K.game.st.god) K.zoomTarget = Math.min(K.zoomTarget, 22); else K.zoomTarget = Math.max(K.zoomTarget, 40); K.game.logMsg(K.game.st.god ? '⚡ MODO DEUS: velocidade, força e invulnerabilidade' : 'Modo deus desligado', '#ffd24a'); }
  if (k === 'r' && !e.repeat) { runOn = !runOn; try { localStorage.setItem('karmika.run', runOn ? '1' : '0'); } catch { /* */ } K.game.logMsg(runOn ? '🏃 Correr: ligado (R)' : '🚶 Andar: ligado (R)', '#ffd24a'); }
  if (k === 'h' && isAdm()) K.game.damage(12, heroPosNow()); /* 12/11: G (modo deus), H (dano em si) e Shift+F5 a F7 (troca de raça) são ferramentas de teste: só para o administrador */
  if (e.key === 'F5' && e.shiftKey && isAdm()) { e.preventDefault(); swapTo('nordic'); return; }
  if (e.key === 'F6' && e.shiftKey && isAdm()) { e.preventDefault(); swapTo('technocrat'); return; }
  if (e.key === 'F7' && e.shiftKey && isAdm()) { e.preventDefault(); swapTo('dwarf'); return; }
  if (/^F[1-8]$/.test(e.key)) { e.preventDefault(); K.useQuick(+e.key.slice(1) - 1 + (e.shiftKey ? 8 : 0)); return; }
  if (e.key === 'Tab') setCombat(!combatMode);
  if (e.code === 'Backquote' && !e.repeat) dispatchEvent(new CustomEvent('karmika:wswap', { detail: e.shiftKey ? -1 : 1 })); /* 03/11: a tecla ao lado do 1 (' no teclado ABNT) troca o jeito de segurar */
  void ORDER;
});
addEventListener('keyup', (e) => { const kk = e.key.toLowerCase(); if (CAM_FREE && kk === 'e' && keys.has('e') && !eRot && !K.inv.isOpen && !K.quests.isOpen && !K.dlg.isOpen) K.interact(); keys.delete(kk); });
/* 12/11 (Erling: "clico no claude e o boneco começa a andar numa direção e não para mais"): quando a janela perde o foco (a caixa de salvar um arquivo,
   Alt+Tab, outro programa por cima), o "soltei a tecla" e o "soltei o botão" nunca chegam e o herói seguia andando para sempre. Perdeu o foco: solta tudo. */
const soltaAndar = () => { keys.clear(); try { K.state.path = []; } catch { /* ainda carregando */ } };
addEventListener('blur', soltaAndar); document.addEventListener('visibilitychange', () => { if (document.hidden) soltaAndar(); });
let eDown = 0, eRot = false;
let drag: { x: number; y: number } | null = null;
K.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
/* Ctrl + clique num jogador: menu dele (mensagem privada, grupo, perfil) — antes de qualquer outro clique no mundo */
K.canvas.addEventListener('pointerdown', (e) => { if (!e.ctrlKey && e.button === 0 && K.net.state === 'on' && !K.festaSys.festa && K.festasNet.size) { const id = K.net.pickAt(e.clientX, e.clientY); if (id && K.festaAskJoin(id)) { e.preventDefault(); e.stopImmediatePropagation(); keys.clear(); return; } } /* 28/10: clicar em quem está numa festa pede para entrar */
  if (!e.ctrlKey || e.button !== 0 || K.net.state !== 'on') return; const id = K.net.pickAt(e.clientX, e.clientY); if (!id) return; e.preventDefault(); e.stopImmediatePropagation(); keys.clear(); K.coop.playerMenu(id, e.clientX, e.clientY); }, true);
const CAM_FREE = false; // câmera fixa (Hades-like); true liga giro Q/E e arrasto com o botão do meio
K.canvas.addEventListener('pointerdown', (e) => { if (CAM_FREE && e.button === 1) { e.preventDefault(); drag = { x: e.clientX, y: e.clientY }; K.canvas.setPointerCapture(e.pointerId); } });
addEventListener('pointermove', (e) => {
  if (!drag) return;
  K.azT -= (e.clientX - drag.x) * 0.006;
  K.pitchT = THREE.MathUtils.clamp(K.pitchT + (e.clientY - drag.y) * 0.004, K.PITCH_MIN, K.PITCH_MAX);
  drag = { x: e.clientX, y: e.clientY };
});
addEventListener('pointerup', () => { drag = null; });
let wswapT = 0;
addEventListener('wheel', (e) => {
  /* 03/11 (Erling): Ctrl + roda = troca rápida do jeito de segurar (duas armas · arma e escudo · duas mãos); o Ctrl+roda do navegador (zoom da página) fica bloqueado no jogo */
  if (e.ctrlKey) { e.preventDefault(); const now = performance.now(); if (now - wswapT > 280) { wswapT = now; dispatchEvent(new CustomEvent('karmika:wswap', { detail: e.deltaY > 0 ? 1 : -1 })); } return; }
  if ((e.target as HTMLElement | null)?.tagName !== 'CANVAS') return; // roda em cima de janela/painel: rola a janela, nunca dá zoom no jogo de trás
  K.zoomTarget = THREE.MathUtils.clamp(K.zoomTarget * Math.exp(e.deltaY * 0.0009), K.ZOOM_MIN, K.ZOOM_MAX);
}, { passive: false });
let nightTarget = 1;
  return { heroPosNow, runningNow, get nightTarget() { return nightTarget; }, set nightTarget(v: typeof nightTarget) { nightTarget = v; }, get combatMode() { return combatMode; }, keys, setCombat, cancelAim, fireAim, aimYaw, get aimSlot() { return aimSlot; }, get outOfBreath() { return outOfBreath; }, set outOfBreath(v: typeof outOfBreath) { outOfBreath = v; }, startDash, get leap() { return leap; }, set leap(v: typeof leap) { leap = v; }, get castQ() { return castQ; }, set castQ(v: typeof castQ) { castQ = v; }, castAt, get lockYaw() { return lockYaw; }, set lockYaw(v: typeof lockYaw) { lockYaw = v; }, get lastActN() { return lastActN; }, set lastActN(v: typeof lastActN) { lastActN = v; }, get lastActP() { return lastActP; }, set lastActP(v: typeof lastActP) { lastActP = v; }, get lockFresh() { return lockFresh; }, set lockFresh(v: typeof lockFresh) { lockFresh = v; }, get guardCone() { return guardCone; }, set guardCone(v: typeof guardCone) { guardCone = v; }, aim, nearYaw, CAM_FREE, get eDown() { return eDown; }, get eRot() { return eRot; }, set eRot(v: typeof eRot) { eRot = v; } };
}
