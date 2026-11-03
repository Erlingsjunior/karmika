/* BUFFS NA TELA e SIGILOS NO CHÃO: o eco (alcançar o grupo), a bênção global, a runa da bênção, o brasão da facção e o sinal do renegado/desgarrado. Saiu do main.ts (02/11). */
import { CATCHUP_MUL } from '../soul';
import { globalNow } from '../eventos';
import { isPremium } from '../premium';
import { type Fac, FAC, crestURL, facOf, sigilTexture } from '../faccoes';
import { type Slot } from '../loot';
import { VOWS } from '../dados/votos';
import { BLESS } from '../ui/icones';
import * as THREE from 'three';
import type { BuffsSigilosCtx } from '../main';

export function createBuffsSigilos(K: BuffsSigilosCtx) {
/* barra de efeitos (buffs e debuffs) logo abaixo do letreiro do alto; a Bênção de Marghar do Premium mora aqui */
const buffEl = document.createElement('div'); buffEl.id = 'buffs'; document.body.appendChild(buffEl);
/* Eco da vida passada (Erling, 23/10): quem reencarna e escolhe a MESMA classe de antes ganha ×4 de XP de classe até o nível antigo.
   O símbolo (o Ouroboros de Karmika) fica aceso só quando vale; noutra classe ele aparece apagado, dizendo qual classe o acende.
   Aceso, a alma deixa um rastro violeta e dourado subindo dos pés do herói. */
const ECHO = (on: boolean) => `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="10.5" fill="none" stroke="${on ? '#c9a0ff' : '#6a6070'}" stroke-width="3.2" stroke-dasharray="58 8"/><path d="M24.5 9.5l3.2-1.2-1.1 3.4z" fill="${on ? '#e6c46a' : '#6a6070'}"/><path d="M16 9.5l5 6.5-5 6.5-5-6.5z" fill="${on ? '#e6c46a' : '#4a4450'}"/><circle cx="16" cy="16" r="1.8" fill="#140a1e"/></svg>`;
function echoState() { const e = K.soul.s.catchup; if (!e) return null; let c = { name: 'Humano', lvl: 1 }; try { c = K.game.classInfo; } catch { /* */ } return { e, on: K.soul.sameClass(c.name, e.cls) && c.lvl < e.until }; }
const echoKey = () => { const q = echoState(); return q ? (q.on ? 'E1' : 'E0') : ''; };
const echoHtml = () => { const q = echoState(); if (!q) return ''; return q.on ? `<div class="bf bless echo" title="Eco da vida passada: você voltou ao caminho de ${q.e.cls}. A classe ganha ×${CATCHUP_MUL} de XP até o nível ${q.e.until}.">${ECHO(true)}<i>×${CATCHUP_MUL}</i></div>` : `<div class="bf echo off" title="Eco da vida passada (apagado): só se acende se você seguir de novo o caminho de ${q.e.cls}. Aí a classe ganha ×${CATCHUP_MUL} de XP até o nível ${q.e.until}.">${ECHO(false)}</div>`; };
setInterval(() => { try { if (K.inside || !K.profile || K.limiar.active) return; } catch { return; } const q = echoState(); if (!q?.on) return; const p = K.hero.root.position;
  for (let i = 0; i < 2; i++) { const a = Math.random() * 6.283, r = 0.45 + Math.random() * 0.25; K.particles.spawn(p.x + Math.cos(a) * r, p.y + 0.08, p.z + Math.sin(a) * r, { vx: -Math.sin(a) * 0.5, vy: 0.9 + Math.random() * 0.7, vz: Math.cos(a) * 0.5, life: 1.1 + Math.random() * 0.5, s0: 0.1, s1: 0.02, c0: Math.random() < 0.5 ? 0xc9a0ff : 0xffd27a, c1: 0x3a1a5a, a: 0.85, drag: 0.6 }); } }, 140);
let buffKey = '';
/** o evento global como efeito na barra (Lua de Sangue, Dia da Aurora): ícone, minutos restantes e, no título, o que ele faz com você */
function globalBuffKey() { try { const g = globalNow(); return g ? g.id + Math.ceil((g.end - Date.now()) / 60000) + K.globalSide(g.id) : ''; } catch { return ''; } }
/** tempo que falta num buff: 45s · 14m · 2h (28/10: "894" segundos não dizia nada) */
const fmtBuffT = (t: number) => t < 60 ? `${Math.ceil(t)}s` : t < 3600 ? `${Math.ceil(t / 60)}m` : `${Math.floor(t / 3600)}h${Math.round((t % 3600) / 60) ? Math.round((t % 3600) / 60) : ''}`;
function globalBuffHtml() { let g: ReturnType<typeof globalNow> = null; try { g = globalNow(); } catch { return ''; } if (!g) return ''; const sd = K.globalSide(g.id), left = Math.max(1, Math.ceil((g.end - Date.now()) / 60000));
  const tip = `${g.name} · mais ${left} min\n${g.text}${sd ? '\n' + K.globalSideText(g.id) : '\nO seu caminho não pende para nenhum lado: o evento não mexe na sua força.'}`.replace(/"/g, '&quot;');
  return `<div class="bf gev ${g.id} ${sd > 0 ? 'good' : sd < 0 ? 'bad' : ''}" title="${tip}">${g.icon}<i>${left}</i></div>`; }
setInterval(() => { const L = K.game.buffs(); const prem = isPremium();
  let eqF: Fac[] = []; try { eqF = [...new Set((['cape', 'shield', 'relic'] as Slot[]).map((sl) => K.inv.eq[sl]?.fac).filter((f): f is Fac => !!f))]; } catch { /* */ }
  const key = globalBuffKey() + echoKey() + (K.vow ? K.vow.id + K.vow.broken + Math.floor(K.vow.secs / 60) : '') + (prem ? 'P' : '') + eqF.join() + L.map((b) => b.id + (b.t === undefined ? "" : fmtBuffT(b.t))).join(); if (key === buffKey) return; buffKey = key;
  buffEl.innerHTML = globalBuffHtml() + echoHtml() + (K.vow ? `<div class="bf ${K.vow.broken ? 'neg' : 'vow'}" title="${K.vow.broken ? `Voto quebrado: “${VOWS[K.vow.id]?.text}”. A bênção se apagou.` : `${VOWS[K.vow.id]?.name}: “${VOWS[K.vow.id]?.text}” — Bênção do Voto: +5% de XP enquanto mantiver.${K.vow.titled ? '' : ` Faltam ${Math.max(0, Math.ceil((3 * 3600 - K.vow.secs) / 60))} min de jogo fiel para o título.`}`}">${K.vow.broken ? '⛓' : '✦'}</div>` : '') + eqF.map((f) => `<div class="bf fac ${f}" title="${FAC[f].name} — “${FAC[f].motto}”. Você carrega o brasão deste lado.${K.inv.eq.relic?.fac === f ? ' A relíquia acende o sigilo aos seus pés.' : ''}"><img src="${crestURL(f)}" alt=""></div>`).join('') + (prem ? `<div class="bf good bless" title="Bênção de Marghar (Premium): conforto no dia a dia — Bolsa do Caminhante, Bolsa Mágica e de Ofício, 8 missões. Nunca dá força.">${BLESS}</div>` : '') + L.map((b) => `<div class="bf ${b.good ? 'good' : 'bad'}" title="${b.name}: ${b.tip}"><span>${b.ic}</span>${b.t !== undefined ? `<i>${fmtBuffT(b.t)}</i>` : ''}</div>`).join('');
  /* 28/10 (Erling): tooltip de verdade (o title nativo demorava e ficava feio) e o bloco à direita, entre a barra de informações e o minimapa */
  buffEl.querySelectorAll('[title]').forEach((e) => { e.setAttribute('data-tip', e.getAttribute('title') || ''); e.removeAttribute('title'); });
  { const mm = document.getElementById('mini')?.getBoundingClientRect(), ui = +(getComputedStyle(document.documentElement).getPropertyValue('--ui') || 1) || 1; if (mm && mm.width) (buffEl.parentElement ?? buffEl).style.right = ((innerWidth - mm.left) + 10) / ui + 'px'; } }, 250);
/* a bênção também aparece aos pés do herói: uma runa violeta e dourada que gira devagar */
/** o olho de Marghar do Premium: o mesmo desenho gira em volta do jogador e, pela rede, em volta de quem é Premium (25/10) */
function makeBlessRune() { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!; g.strokeStyle = '#e6c46a'; g.lineWidth = 3; g.beginPath(); g.ellipse(32, 32, 24, 13, 0, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#c9a0ff'; g.beginPath(); g.arc(32, 32, 7, 0, Math.PI * 2); g.fill(); g.fillStyle = '#140a1e'; g.beginPath(); g.arc(32, 32, 3, 0, Math.PI * 2); g.fill();
  const tx = new THREE.CanvasTexture(c); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthWrite: false, opacity: 0.85 })); sp.scale.setScalar(0.42); sp.visible = false; return sp; }
const blessRune = makeBlessRune(); K.scene.add(blessRune);
/* o sigilo da facção no chão: aparece quando a relíquia do lado está equipada (o Fio gira devagar e brilha em ouro; os Desfiados giram ao contrário, em brasa) */
const facSigil = (() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0.8, blending: THREE.AdditiveBlending, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 3; m.visible = false; K.scene.add(m); return m; })();
let facNow: Fac | null = null;
function updateFacSigil(t: number) {
  let rf: Fac | null = null; try { rf = K.inv.eq.relic?.fac ?? facOf(K.inv.eq.relic?.base) ?? null; } catch { /* */ }
  if (rf !== facNow) { facNow = rf; const mt = facSigil.material as THREE.MeshBasicMaterial; mt.map = rf ? sigilTexture(rf) : null; mt.needsUpdate = true; }
  facSigil.visible = !!rf && !K.inside; if (!rf) return;
  const hp = K.hero.root.position, mt = facSigil.material as THREE.MeshBasicMaterial; facSigil.position.set(hp.x, hp.y + 0.05, hp.z);
  facSigil.rotation.z = rf === 'fio' ? t * 0.22 : -t * 0.35; mt.opacity = rf === 'fio' ? 0.62 + Math.sin(t * 1.6) * 0.12 : 0.55 + Math.max(0, Math.sin(t * 5.3) * Math.sin(t * 1.1)) * 0.3; // a brasa dos Desfiados pisca irregular
}
/* o sigilo do clã aos pés (27/10, Erling: "sigilo nos pés sim!"): Renegados = sol nascente dourado (voltaram da sombra para a luz);
   Desgarrados = estrela caindo em roxo (largaram a luz pela sombra). Um anel largo, por fora do anel da postura. */
const outTex = new Map<string, THREE.CanvasTexture>();
function outcastTex(kind: 'renegado' | 'desgarrado') { let t2 = outTex.get(kind); if (t2) return t2; const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d')!; g.translate(256, 256);
  const col = kind === 'renegado' ? '#ffd27a' : '#b47aff'; g.strokeStyle = col; g.fillStyle = col; g.lineCap = 'round'; g.lineWidth = 6; g.globalAlpha = 0.9;
  g.beginPath(); g.arc(0, 0, 240, 0, 6.283); g.stroke(); g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, 214, 0, 6.283); g.stroke();
  for (let k = 0; k < 6; k++) { g.save(); g.rotate(k * Math.PI / 3); g.translate(0, -227);
    if (kind === 'renegado') { g.beginPath(); g.arc(0, 6, 9, Math.PI, 0); g.fill(); for (let r = 0; r < 5; r++) { const a2 = Math.PI + (r + 0.5) * Math.PI / 5; g.beginPath(); g.moveTo(Math.cos(a2) * 12, 6 + Math.sin(a2) * 12); g.lineTo(Math.cos(a2) * 19, 6 + Math.sin(a2) * 19); g.lineWidth = 2.5; g.stroke(); } }
    else { g.beginPath(); for (let r = 0; r < 10; r++) { const a2 = r * Math.PI / 5 - Math.PI / 2, rr = r % 2 ? 4.5 : 11; r ? g.lineTo(Math.cos(a2) * rr, Math.sin(a2) * rr) : g.moveTo(Math.cos(a2) * rr, Math.sin(a2) * rr); } g.closePath(); g.fill(); g.lineWidth = 2; g.beginPath(); g.moveTo(6, -6); g.lineTo(18, -16); g.moveTo(9, -1); g.lineTo(22, -8); g.stroke(); }
    g.restore(); }
  for (let k = 0; k < 36; k++) { if (k % 6 === 0) continue; const a2 = k / 36 * 6.283; g.lineWidth = 2; g.beginPath(); g.moveTo(Math.cos(a2) * 218, Math.sin(a2) * 218); g.lineTo(Math.cos(a2) * 236, Math.sin(a2) * 236); g.stroke(); }
  t2 = new THREE.CanvasTexture(c); t2.colorSpace = THREE.SRGBColorSpace; t2.anisotropy = 4; t2.userData.keep = true; outTex.set(kind, t2); return t2; }
const outSigil = (() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 3.3), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, depthTest: false, opacity: 0.7, blending: THREE.AdditiveBlending, toneMapped: false, fog: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 2; m.visible = false; K.scene.add(m); return m; })();
let outNow = '';
function updateOutSigil(t: number) { const oc = (K.soul.s.outcast ?? '') as '' | 'renegado' | 'desgarrado', mt = outSigil.material as THREE.MeshBasicMaterial;
  if (oc !== outNow) { outNow = oc; mt.map = oc ? outcastTex(oc) : null; mt.needsUpdate = true; }
  outSigil.visible = !!oc && !K.inside && !K.compSys.riding; if (!oc) return; const hp = K.hero.root.position; outSigil.position.set(hp.x, hp.y + 0.04, hp.z);
  outSigil.rotation.z = oc === 'renegado' ? t * 0.12 : -t * 0.12; mt.opacity = 0.5 + Math.sin(t * 1.3) * 0.12; }
  return { makeBlessRune, buffEl, updateFacSigil, updateOutSigil, blessRune };
}
