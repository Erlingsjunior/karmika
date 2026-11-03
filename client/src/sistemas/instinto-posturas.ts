/* INSTINTO DE CLASSE e POSTURAS: ligar/desligar (F), duração e recarga, a aura, a lente e o anel; a barra de posturas, o círculo rúnico nos pés, o aviso grande e a névoa da treva. Saiu do main.ts (02/11). */
import { instinctOf } from '../instinto';
import { INSTINCT_GLYPH, INST_GLYPH_BASE, ROLE_SVG, THIRD_EYE } from '../ui/icones';
import * as THREE from 'three';
import { createStances, type Stance, ROLE_NAME } from '../posturas';
import { stanceTex, ST_ICON } from '../fx/posturas-tex';
import { type PathId } from '../vidente';
import type { InstintoPosturasCtx } from '../main';

export function createInstintoPosturas(K: InstintoPosturasCtx) {
/* ---------- Instinto e falas do herói (instinto.ts, 24/10) ---------- */
/** a alma dos NPCs que importam para o Instinto (quem é da Luz, da Sombra, ou de um caminho) */
/* ---------- Instinto de classe: liga e desliga com F (ou no menu de magias, K). Só você vê a aura. ---------- */
let instinctOn = (() => { try { return localStorage.getItem('karmika.instinct') === '1'; } catch { return false; } })();
const myInstinct = () => instinctOf(K.myPath(), K.profile?.origin ?? 'human');
/* Instinto com duração e recarga (Erling, 27/10): fica ligado por 5 minutos, com as penalidades (−15% de passo, +10% de dano recebido); depois desliga sozinho e só volta depois de 15 minutos de recarga */
const INST_DUR = 5 * 60, INST_CD = 15 * 60; let instUntil = 0, instCdUntil = 0;
try { instUntil = +(localStorage.getItem('karmika.instuntil') || 0); instCdUntil = +(localStorage.getItem('karmika.instcd') || 0); if (instinctOn && Date.now() > instUntil) { instinctOn = false; localStorage.setItem('karmika.instinct', '0'); } } catch { /* */ }
const fmtMin = (ms: number) => { const s0 = Math.max(0, Math.ceil(ms / 1000)); return s0 >= 60 ? `${Math.floor(s0 / 60)} min ${String(s0 % 60).padStart(2, '0')} s` : `${s0} s`; };
function toggleInstinct(v = !instinctOn) { const I = myInstinct();
  if (v && Date.now() < instCdUntil) { K.game.logMsg(`✧ ${I.name} ainda descansa: volta em ${fmtMin(instCdUntil - Date.now())}.`, '#b9c6e0'); return; }
  instinctOn = v; try { localStorage.setItem('karmika.instinct', v ? '1' : '0'); if (v) { instUntil = Date.now() + INST_DUR * 1000; localStorage.setItem('karmika.instuntil', String(instUntil)); } else { instCdUntil = Date.now() + INST_CD * 1000; localStorage.setItem('karmika.instcd', String(instCdUntil)); } } catch { /* */ }
  K.game.logMsg(v ? `✧ ${I.name}: ligado por 5 minutos. ${I.desc} (Atenção custa: −15% de passo e +10% de dano recebido enquanto estiver ligado.)` : `✧ ${I.name}: desligado. Volta em 15 minutos.`, v ? I.css : '#b9c6e0'); K.audio.instinct(v); instFx(v); updateInstBtn(); }
/* ---------- o MOMENTO de ligar o Instinto (Erling, 25/10) ----------
   1. o símbolo do instinto do seu caminho (ou do seu povo) se abre sobre a cabeça do herói e sobe sumindo;
   2. um anel de energia corre pelo chão e uma aura na cor do instinto fica no herói uns segundos, depois assenta num brilho leve;
   3. a LENTE: a borda da tela se fecha como uma íris e reabre, e enquanto o Instinto está ligado o mundo fica um pouco mais nítido
      (mais contraste e cor no centro, a borda mais escura): o herói está focado. */
const INST_KEY = () => { const p = K.myPath(); if (p && INSTINCT_GLYPH[p]) return p; const o = K.profile?.origin ?? 'human'; return o === 'dwarf' ? 'anao' : o === 'elf' ? 'elfo' : 'humano'; };
const instPop = document.createElement('div'); instPop.id = 'instpop'; document.body.appendChild(instPop);
const instLens = document.createElement('div'); instLens.id = 'instlens'; document.body.appendChild(instLens);
const instRing = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 56).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide }));
instRing.visible = false; K.scene.add(instRing);
let instFxT = -1, instAuraT = 0; const instV = new THREE.Vector3(), instCol = new THREE.Color();
function instFx(on: boolean) { const I = myInstinct(); instCol.set(I.color);
  document.body.classList.toggle('inst-on', on); document.documentElement.style.setProperty('--instc', I.css);
  if (!on) { instPop.className = ''; instAuraT = 0; return; }
  instPop.innerHTML = `${INST_GLYPH_BASE(INSTINCT_GLYPH[INST_KEY()] ?? INSTINCT_GLYPH.humano)}<b>${I.name}</b>`; instPop.style.color = I.css;
  instPop.className = ''; void instPop.offsetWidth; instPop.className = 'go';
  instLens.className = ''; void instLens.offsetWidth; instLens.className = 'go';
  instFxT = 0; instAuraT = 6; (instRing.material as THREE.MeshBasicMaterial).color.copy(instCol); instRing.visible = true;
  const hp = K.heroPos; for (let i = 0; i < 46; i++) { const a = Math.random() * 6.283, r = 0.3 + Math.random() * 0.5; K.particles.spawn(hp.x + Math.cos(a) * r, hp.y + 0.1 + Math.random() * 0.4, hp.z + Math.sin(a) * r, { vx: Math.cos(a) * 1.4, vy: 1.6 + Math.random() * 2.2, vz: Math.sin(a) * 1.4, life: 0.9 + Math.random() * 0.6, s0: 0.22, s1: 0.03, c0: 0xffffff, c1: I.color, a: 1, g: -0.4 }); } }
function updateInstFx(dt: number) {
  const hp = K.heroPos;
  if (instFxT >= 0) { instFxT += dt; const k = Math.min(1, instFxT / 0.9); const m = instRing.material as THREE.MeshBasicMaterial;
    instRing.position.set(hp.x, hp.y + 0.05, hp.z); instRing.scale.setScalar(0.6 + k * 4.2); m.opacity = 0.9 * (1 - k); if (k >= 1) { instFxT = -1; instRing.visible = false; } }
  if (instPop.className === 'go') { instV.set(hp.x, hp.y + 2.1, hp.z).project(K.camera); const r = K.canvas.getBoundingClientRect(); instPop.style.left = `${r.left + (instV.x * 0.5 + 0.5) * r.width}px`; instPop.style.top = `${r.top + (-instV.y * 0.5 + 0.5) * r.height}px`; }
  /* a energia que fica: uns segundos de fagulhas subindo do corpo, que vão rareando; depois, só um fio de vez em quando enquanto ligado */
  /* FPS (27/10): o que fica longe do herói nem entra na cena — caravanas, bocas de masmorra, placas e pontes do mundo inteiro
     eram percorridas todo quadro (milhares de objetos); agora só o que está a menos de ~130 m é visível */
  farCullT -= dt; if (farCullT <= 0) { farCullT = 0.5; const hp0 = K.heroPosNow(); const near = (o: THREE.Object3D, r: number) => { const dx = o.position.x - hp0.x, dz = o.position.z - hp0.z; return dx * dx + dz * dz < r * r; };
    for (const c of K.scene.children) if (c.userData.farCull) { const v = near(c, 130); if (c.visible !== v) c.visible = v; }
    for (const c of K.objs.bridgeMeshes.children) { const v = near(c, 170); if (c.visible !== v) c.visible = v; } }
  if (instinctOn && Date.now() > instUntil) toggleInstinct(false); instBtnT -= dt; if (instBtnT <= 0) { instBtnT = 1; if (instinctOn || Date.now() < instCdUntil) updateInstBtn(); }
  if (instinctOn && !K.inside) { if (instAuraT > 0) instAuraT -= dt; const rate = instAuraT > 0 ? 6 + instAuraT * 5 : 0.8;
    if (Math.random() < dt * rate) { const a = Math.random() * 6.283, r = 0.25 + Math.random() * 0.25; K.particles.spawn(hp.x + Math.cos(a) * r, hp.y + 0.2 + Math.random() * 1.2, hp.z + Math.sin(a) * r, { vx: 0, vy: 0.7 + Math.random() * 0.6, vz: 0, life: 1 + Math.random() * 0.8, s0: instAuraT > 0 ? 0.16 : 0.1, s1: 0.02, c0: 0xffffff, c1: instCol.getHex(), a: instAuraT > 0 ? 0.9 : 0.55, flit: 1 }); } }
}
/* o Instinto mora no menu de ações (junto de Mapa, Deus e Menu): um botão pequeno com o terceiro olho; F continua ligando */
/* barra de Posturas e Instinto: em cima do lado direito da barra de magias (Erling, 25/10) */
var stanceSys: ReturnType<typeof createStances> | null = null;
/* o ícone da postura nos pés (25/10): um anel com o símbolo do papel, na cor da postura, girando devagar sob o herói */
/* (a origem do herói para o círculo da postura agora vai como parâmetro de stanceTex — fx/posturas-tex.ts) */
/* o brilho por baixo (aditivo, gradiente radial): só aparece forte quando a postura acabou de mudar */
const stGlowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!; const gr = g.createRadialGradient(64, 64, 8, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.62, 'rgba(255,255,255,0.18)'); gr.addColorStop(0.86, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.userData.keep = true; return t; })();
const stGlow = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 3.1), new THREE.MeshBasicMaterial({ map: stGlowTex, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false, toneMapped: false })); stGlow.rotation.x = -Math.PI / 2; stGlow.renderOrder = 2; K.scene.add(stGlow);
const stRing = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), /* 27/10: aura menor, acaba antes das barras de fôlego/vida */ new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, depthTest: false, opacity: 0.8, fog: false, toneMapped: false })); stRing.rotation.x = -Math.PI / 2; stRing.renderOrder = 3; /* depthTest off: a grama alta não come o anel */ K.scene.add(stRing);
/* forte por 2 minutos depois de trocar; depois esmaece em 6 s até ficar discreta (não atrapalha a visão) */
const ST_STRONG = 120, ST_FADE = 6;
let stRingId = '', stPop = 0, stAge = 0;
function stanceRing(st: { id: string; role: string; col: string } | null, dt: number) {
  if (!st) { stRing.visible = stGlow.visible = false; return; }
  const m = stRing.material as THREE.MeshBasicMaterial, gm = stGlow.material as THREE.MeshBasicMaterial;
  const org = K.profile?.origin ?? 'human', rid = st.id + ':' + org;
  if (rid !== stRingId) { const first = stRingId === ''; stRingId = rid; m.map = stanceTex(st.id, st.role, st.col, org); m.needsUpdate = true; gm.color.set(st.col); stAge = 0; if (!first) stPop = 1; }
  stAge += dt; stPop = Math.max(0, stPop - dt * 1.5);
  const k = stAge < ST_STRONG ? 1 : Math.max(0, 1 - (stAge - ST_STRONG) / ST_FADE); /* 1 = forte, 0 = discreta */
  const p = K.hero.root.position, vis = !K.riding; stRing.visible = vis; /* 28/10 (Erling): o halo brilhante em volta da postura é só de quem tem alinhamento de luz +2000 (a mesma regra das auras do mundo); os outros veem só a aura de runas */ stGlow.visible = vis && (K.soul.s.luzT ?? 0) - (K.soul.s.sombraT ?? 0) >= 2000;
  stRing.position.set(p.x, p.y + 0.06, p.z); stGlow.position.set(p.x, p.y + 0.05, p.z);
  stRing.rotation.z += dt * (0.18 + 0.22 * k); stGlow.rotation.z -= dt * 0.1;
  const pulse = 0.5 + 0.5 * Math.sin(stAge * 2.4);
  stRing.scale.setScalar(1 + stPop * 0.9 - stPop * stPop * 0.5);
  stGlow.scale.setScalar(1 + stPop * 1.6); /* 28/10 (Erling): a aura não cresce nem encolhe — ela acende e apaga devagar, e fica mais marcante */
  m.opacity = Math.min(1, 0.4 + 0.55 * pulse + 0.2 * stPop); m.color.setScalar(0.8 + 0.7 * pulse); /* acende (mais claro que o normal) e apaga devagar */
  gm.opacity = Math.min(1, 0.05 + 0.5 * pulse + 0.8 * stPop); void k; }
/* a névoa espessa da treva cegante (27/10): tufos escuros e lentos, em mistura normal (o escuro aparece), girando em volta do herói */
const mistTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!; const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(8,4,14,0.95)'); gr.addColorStop(0.5, 'rgba(18,8,28,0.55)'); gr.addColorStop(1, 'rgba(18,8,28,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t2 = new THREE.CanvasTexture(c); t2.userData.keep = true; return t2; })();
const mistG = new THREE.Group(); mistG.visible = false; K.scene.add(mistG); const mistP: { s: THREE.Sprite; a: number; r: number; h: number; sp: number }[] = [];
for (let i = 0; i < 10; i++) { const s2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex, transparent: true, depthWrite: false, depthTest: false, opacity: 0, fog: false, toneMapped: false })); s2.userData.keep = true; s2.renderOrder = 6; mistG.add(s2); mistP.push({ s: s2, a: i / 10 * 6.283, r: 0.5 + (i % 3) * 0.35, h: 0.2 + (i % 4) * 0.5, sp: 0.25 + (i % 3) * 0.12 }); }
let mistK = 0;
function darkMist(on: boolean, dt: number) { mistK += ((on ? 1 : 0) - mistK) * Math.min(1, dt * 1.5); mistG.visible = mistK > 0.02; if (!mistG.visible) return; const p = K.hero.root.position; mistG.position.set(p.x, p.y, p.z);
  for (const m of mistP) { m.a += dt * m.sp; m.s.position.set(Math.cos(m.a) * m.r, m.h + Math.sin(m.a * 1.7) * 0.15, Math.sin(m.a) * m.r); m.s.scale.setScalar(2.1 + Math.sin(m.a * 0.9) * 0.35); (m.s.material as THREE.SpriteMaterial).opacity = 0.85 * mistK; } }
/* o aviso grande no meio da tela: nome, papel e o que muda (fica 3 s, dá para ler) */
const stBan = document.createElement('div'); stBan.id = 'stban'; document.body.appendChild(stBan); let stBanT = 0;
function stanceBanner(st: Stance, eff: string) { stBan.innerHTML = `<i style="color:${st.col}">${ST_ICON[st.role] ?? '◎'}</i><div><b style="color:${st.col}">${st.name}</b><small>${ROLE_NAME[st.role]} · ${eff}</small><em>${st.tip.split("\n")[0]}</em></div>`; stBan.classList.remove('on'); void stBan.offsetWidth; stBan.classList.add('on'); clearTimeout(stBanT); stBanT = window.setTimeout(() => stBan.classList.remove('on'), 3200); }
const stanceBar = document.createElement('div'); stanceBar.id = 'stances'; /* 28/10 (Erling): posturas e Instinto moram lá em cima, junto do Premium e dos buffs, com balão explicando */ { const top = document.createElement('div'); top.id = 'topfx'; document.body.appendChild(top); top.appendChild(stanceBar); top.appendChild(K.buffEl); }
let stanceSig = '';
function renderStances() { if (!stanceSys) return; const L = stanceSys.list(), cur = stanceSys.current();
  const sig = L.map((s) => `${s.id}:${stanceSys!.open(s) ? 1 : 0}`).join(',') + '|' + cur.id; if (sig === stanceSig) return; stanceSig = sig;
  stanceBar.querySelectorAll('.stance').forEach((e) => e.remove());
  for (const s of L) { if (!stanceSys.open(s)) continue; /* 28/10 (Erling): postura que ainda não aprendi não aparece */ const b = document.createElement('button'); const op = stanceSys.open(s), on = s.id === cur.id; b.className = `stance ${on ? 'on' : ''} ${op ? '' : 'locked'}`; b.dataset.st = s.id; b.style.setProperty('--sc', s.col);
    const q = s.quest ? K.quests.def(s.quest) : null, trial = s.quest && !K.quests.q.done.includes(s.quest) && !!K.quests.q.active[s.quest];
    b.innerHTML = `${ROLE_SVG[s.role]}${op ? '' : '<i class="lk">🔒</i>'}${trial ? '<i class="tr">treino</i>' : ''}`;
    b.dataset.tip = `${s.name} · ${ROLE_NAME[s.role]}${on ? ' (em uso)' : ''}\n${s.tip}${op ? '\nClique ou V para trocar.' : `\n🔒 Abre na missão “${q?.name ?? 'de postura'}”${q ? ` com ${q.giver}, a partir do nível ${q.lvl}` : ''}.`}`;
    b.addEventListener('click', (e) => { e.stopPropagation(); stanceSys!.pick(s.id); renderStances(); }); stanceBar.appendChild(b); } }
function placeStances() { /* 28/10: a barra das posturas foi para o topo (#topfx), não acompanha mais a barra de magias */ }
addEventListener('resize', () => setTimeout(placeStances, 50));
const instBtn = document.createElement('button'); instBtn.id = 'instbtn'; instBtn.dataset.b = 'inst'; stanceBar.appendChild(instBtn); instBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleInstinct(); });
/* terceiro olho do Instinto (25/10): amêndoa, íris e pupila losango com o MESMO centro (16,16), simétrico em cima e embaixo, sem raios que puxem o desenho para cima */
function updateInstBtn() { const I = myInstinct(), now = Date.now(), cd = !instinctOn && now < instCdUntil; instBtn.innerHTML = `${THIRD_EYE}<kbd>F</kbd>${instinctOn ? `<em>${fmtMin(instUntil - now)}</em>` : cd ? `<em class="cd">${fmtMin(instCdUntil - now)}</em>` : ''}`; instBtn.classList.toggle('on', instinctOn); instBtn.classList.toggle('cd', cd); instBtn.style.setProperty('--ic', I.css); instBtn.dataset.tip = `${I.name} — ${I.desc}\n${instinctOn ? `Ligado · acaba em ${fmtMin(instUntil - now)}` : cd ? `Em recarga · volta em ${fmtMin(instCdUntil - now)}` : 'Desligado'} (F para ligar; dura 5 min, recarga de 15 min)`; }
let instBtnT = 0, farCullT = 0;

stanceSys = createStances({ path: () => K.myPath() as PathId | null, isDone: (q) => K.quests.q.done.includes(q), isActive: (q) => !!K.quests.q.active[q], apply: (e) => K.game.setStance(e), log: (tx, c) => K.game.logMsg(tx, c), night: () => K.game.isNight(),
  onChange: (st: Stance) => { const p = K.hero.root.position, col = new THREE.Color(st.col).getHex(); K.audio.instinct(true);
    for (let i = 0; i < 36; i++) { const a = i / 36 * 6.283; K.particles.spawn(p.x + Math.cos(a) * 0.9, p.y + 0.15, p.z + Math.sin(a) * 0.9, { vx: Math.cos(a) * 2.2, vy: 0.6 + Math.random() * 0.8, vz: Math.sin(a) * 2.2, life: 0.8, s0: 0.28, s1: 0.04, c0: 0xffffff, c1: col, a: 1, drag: 2 }); }
    for (let i = 0; i < 20; i++) K.particles.spawn(p.x + (Math.random() - 0.5) * 0.6, p.y + 0.2 + Math.random() * 1.6, p.z + (Math.random() - 0.5) * 0.6, { vy: 1.2 + Math.random(), life: 1, s0: 0.2, s1: 0.03, c0: col, c1: col, a: 0.9, drag: 1 });
    K.game.dmgText(p.clone().setY(p.y + 2.9), `Postura: ${st.name}`, false, st.col); K.game.logMsg(`⚔ Postura: ${st.name} (${ROLE_NAME[st.role]}).`, st.col);
    /* a troca com corpo: o herói respira fundo e assume a postura; o anel dos pés pulsa; o aviso fica 3 s */
    if (!K.hero.acting && !K.riding) K.hero.act('breath'); stPop = 1; K.audio.equip(st.role === 'tank' ? 'metal' : st.role === 'heal' ? 'jewel' : 'leather');
    for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; K.particles.spawn(p.x + Math.cos(a) * 1.3, p.y + 0.05, p.z + Math.sin(a) * 1.3, { vx: -Math.cos(a) * 1.6, vy: 2.2, vz: -Math.sin(a) * 1.6, life: 0.7, s0: 0.22, s1: 0.04, c0: col, c1: 0xffffff, a: 1, drag: 2.5 }); }
    const E = st.eff, ef = [E.dmg ? `${E.dmg > 0 ? '+' : ''}${Math.round(E.dmg * 100)}% dano` : '', E.def ? `${E.def > 0 ? '+' : ''}${Math.round(E.def * 100)}% defesa` : '', E.heal ? `+${Math.round(E.heal * 100)}% cura` : '', E.move ? `+${Math.round(E.move * 100)}% passo` : '', E.crit ? `+${Math.round(E.crit * 100)}% crítico` : '', E.leech ? `${Math.round(E.leech * 100)}% roubo de vida` : ''].filter(Boolean).join(' · ') || 'sem bônus nem penalidade';
    stanceBanner(st, ef); } });
stanceSys.sync();
setInterval(() => { stanceSys?.sync(); renderStances(); placeStances(); }, 500);
setTimeout(() => { updateInstBtn(); document.body.classList.toggle('inst-on', instinctOn); document.documentElement.style.setProperty('--instc', myInstinct().css); }, 0);
  return { get instinctOn() { return instinctOn; }, myInstinct, toggleInstinct, get stanceSys() { return stanceSys; }, renderStances, stanceRing, darkMist, updateInstFx };
}
