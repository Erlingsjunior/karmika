/* GUIA DE MISSÃO E MAPA GRANDE: onde fica o objetivo rastreado, a seta, o alfinete, os marcadores e o mapa do mundo. Saiu do main.ts (02/11). */
import { type EnemyType, MAP_W, regionAt, REGIONS, CITY, heightAt } from '../world';
import { oceanPattern, drawSeaArt, drawMapFrame } from './mapa-arte';
import { TILE_M as T } from '@karmika/shared';
import { DEFS } from '../enemies';
import * as THREE from 'three';
import { fine } from '../dual3d';
import { CUT } from '../toon3d';
/** 03/11 (Erling: "minha aura aparece atrás das construções, não é para aparecer"): com o herói escondido atrás de casa (o corte de visão ligado), as barras e as bússolas do pé somem */
const heroBehind = () => CUT.uCut.value.w > 0;
import { questCat } from '../quests';
import { type DungeonFloor } from '../dungeon3d';
import { STATION_INFO } from '../stations3d';
import { SHOPDEF } from '../inventory';
import type { GuiaMapaCtx } from '../main';

export function createGuiaMapa(K: GuiaMapaCtx) {
/* ---------- guia de missão: onde fica o objetivo rastreado ---------- */
const DROP_SRC: Record<string, EnemyType[] | 'tree' | 'rock' | 'water'> = { hide: ['deer', 'boar', 'wolf', 'coyote'], meat: ['deer', 'boar', 'wolf', 'coyote', 'frostwolf'], claw: ['rat'], dust: ['fairy'], sap: ['treant'], wood: 'tree', stick: 'tree', apple: 'tree', stone: 'rock', fish: 'water' };
let pinT: { x: number; y: number; label: string } | null = null;
function setPin(p: { x: number; y: number; label: string } | null) { pinT = p; if (p) { K.game.logMsg(`🔍 Indo para ${p.label}.`, '#b9c6e0'); K.audio.click(); } K.updateBanner(); }
function questTarget(dq?: ReturnType<typeof K.quests.def> | null, primary = true): { x: number; y: number; label: string } | null {
  if (primary && pinT) { if (Math.hypot(pinT.x - K.state.fx, pinT.y - K.state.fy) * T < 4) { K.game.logMsg(`🔍 Você chegou: ${pinT.label}.`, '#b9c6e0'); pinT = null; K.updateBanner(); } else return pinT; }
  if (primary) { const tk = K.eventos.tracking(); if (tk) { const dd = Math.hypot(tk.x - K.state.fx, tk.y - K.state.fy) * T;
      if (!tk.joined && dd > 5) return { x: tk.x, y: tk.y, label: `Evento: ${tk.name} · fale com ${tk.herald}` };
      if (tk.joined && dd > 24) return { x: tk.x, y: tk.y, label: `Evento: ${tk.name}` }; } }
  const d = dq === undefined ? K.quests.tracked : dq; if (!d) return null; const h0 = hereT();
  /* 09/11: dois com o mesmo nome (um da história, outro morador): a seta vai para o mais perto — quem está na sua frente */
  const npcAt = (name: string) => { const h = K.hero.root.position; let n: (typeof K.npcSys.npcs)[number] | null = null, bd = Infinity;
    for (const q of K.npcSys.npcs) { if (q.def.name !== name) continue; const dd = Math.hypot(q.pos.x - h.x, q.pos.z - h.z); if (dd < bd) { bd = dd; n = q; } }
    return n ? { x: n.pos.x / T, y: n.pos.z / T } : null; };
  const i = K.quests.firstOpen(d);
  if (i < 0) { const who = d.turnin ?? d.giver, p = npcAt(who); return p ? { ...p, label: `Entregar a ${who}` } : null; }
  const o = d.objs[i];
  const nearestSpawn = (types: EnemyType[]) => { let best: { x: number; y: number } | null = null, bd = 1e9; for (const sp of K.city.spawns) if (types.includes(sp.type)) { const dd = Math.hypot(sp.x - h0.x, sp.y - h0.y) * (1 + Math.max(0, (sp.lvl ?? 1) - K.game.st.lvl - 2) * 0.8); /* a guia prefere bichos do seu nível */ if (dd < bd) { bd = dd; best = { x: sp.x, y: sp.y }; } } return best; };
  const nearestProp = (kind: string, small = false) => { let best: { x: number; y: number } | null = null, bd = 1e9; for (const p of K.city.props) { if (p.kind !== kind || (p as { gone?: boolean }).gone || (small && p.w > 2)) continue; const dd = Math.hypot(p.gx + 0.5 - h0.x, p.gy + 0.5 - h0.y); if (dd < bd) { bd = dd; best = { x: p.gx + 0.5, y: p.gy + 0.5 }; } } return best; };
  const nearestTile = (tile: string) => { let best: { x: number; y: number } | null = null, bd = 1e9; const cx = Math.round(h0.x), cy = Math.round(h0.y); for (let y = cy - 40; y <= cy + 40; y += 2) for (let x = cx - 40; x <= cx + 40; x += 2) if (K.city.map[y]?.[x] === tile) { const dd = Math.hypot(x - h0.x, y - h0.y); if (dd < bd) { bd = dd; best = { x, y }; } } return best; };
  if (o.kind === 'kill') { /* 26/10: mira o bicho vivo mais perto; se todos estão mortos, diz quando volta (o Torturador "sumia" e a bússola parava) */
    let live: { x: number; y: number } | null = null, ld = 1e9, wait = 0; for (const e of K.game.enemies.list) { if (e.type !== o.type) continue; const dd = Math.hypot(e.pos.x / T - h0.x, e.pos.z / T - h0.y); if (e.alive) { if (dd < ld) { ld = dd; live = { x: e.pos.x / T, y: e.pos.z / T }; } } else if (dd < 40) wait = Math.max(wait, e.respawn); }
    if (live) return { ...live, label: `${ENEMY_LABEL(o.type)} por aqui` };
    const p = nearestSpawn([o.type]); return p ? { ...p, label: wait > 0 && wait < 1e8 ? `${ENEMY_LABEL(o.type)} volta em ${Math.ceil(wait)} s` : `${ENEMY_LABEL(o.type)} por aqui` } : null; }
  if (o.kind === 'collect') { const src = DROP_SRC[o.item]; if (!src) return null; const p = src === 'tree' ? nearestProp('tree') : src === 'rock' ? nearestProp('rock', true) : src === 'water' ? nearestTile('water') : nearestSpawn(src); return p ? { ...p, label: src === 'tree' ? 'Árvores' : src === 'rock' ? 'Pedras' : src === 'water' ? 'Água (pescar)' : 'Caça por aqui' } : null; }
  if (o.kind === 'talk') { const p = npcAt(o.npc); return p ? { ...p, label: o.npc } : null; }
  if (o.kind === 'visit') { const poi = K.city.pois.find((q) => q.name === o.poi); return poi ? { x: poi.x, y: poi.y, label: poi.name } : null; }
  if (o.kind === 'dungeon') { const en = K.dgs.entrances.find((q) => q.d.id === o.id); return en ? { x: en.x, y: en.y, label: `Entrada: ${o.name}` } : null; }
  if (o.kind === 'craft') { const p = npcAt('Doran'); return p ? { ...p, label: 'Criar no menu I' } : null; }
  if (o.kind === 'sense') { const g = K.senseGoals().find((q) => q.id === `${d.id}:${i}`); if (!g) return null; const dS = Math.hypot(g.from.x - h0.x, g.from.y - h0.y), dT2 = Math.hypot(g.to.x - h0.x, g.to.y - h0.y); return dT2 < dS || dS < 8 ? (K.instinctOn ? { ...g.to, label: g.label } : { ...g.from, label: 'Ligue o Instinto (F) e siga o rastro' }) : { ...g.from, label: `Onde o rastro começa${K.instinctOn ? '' : ' · ligue o Instinto (F)'}` }; }
  if (o.kind === 'escort' || o.kind === 'rescue') { const p = K.caravans.where(o.kind, o.route, o.kind === 'rescue' ? o.at : 0); return p ? { ...p, label: o.kind === 'escort' ? `Caravana: ${o.label}` : `Caravana caída: ${o.label}` } : null; }
  return null;
}
const ENEMY_LABEL = (t: EnemyType) => DEFS[t]?.name ?? t;
const guideEl = document.createElement('div'); guideEl.id = 'guide'; guideEl.innerHTML = '<div class="lbl"><i>◆</i><span></span><small></small></div>'; document.body.appendChild(guideEl);
const guideLbl = guideEl.querySelector('.lbl span') as HTMLElement, guideDist = guideEl.querySelector('.lbl small') as HTMLElement;
/* fôlego: arco amarelo no pé do herói (voltado para a câmera), esvazia ao correr e ao dar dash */
const stamG = new THREE.Group(); K.scene.add(fine(stamG));
/* 11/11 (Erling: "as barras do player são desenhadas, não são efeitos 3D bonitos"): as duas barras viraram TUBOS — um trilho escuro de metal
   deitado no chão e, dentro dele, um tubo de luz (vida rubra, fôlego marfim) que pega brilho da luz do mundo. O tubo cheio é feito uma vez só;
   o quanto aparece é só o intervalo desenhado (antes a malha era destruída e refeita a cada quadro). */
const ARC_SEG = 56, ARC_RAD = 7;
/** tubo em arco deitado no chão: começa no ângulo a0 e anda `span` (negativo = sentido contrário); os triângulos vão em ordem ao longo do arco */
function arcTube(r: number, tube: number, a0: number, span: number): THREE.BufferGeometry {
  const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  for (let i = 0; i <= ARC_SEG; i++) { const a = a0 + span * i / ARC_SEG, cx = Math.cos(a), cz = -Math.sin(a);
    for (let j = 0; j < ARC_RAD; j++) { const b = j / ARC_RAD * 6.2832, nr = Math.cos(b), ny = Math.sin(b); pos.push((r + tube * nr) * cx, tube * ny * 0.8, (r + tube * nr) * cz); nor.push(nr * cx, ny, nr * cz); } }
  for (let i = 0; i < ARC_SEG; i++) for (let j = 0; j < ARC_RAD; j++) { const a = i * ARC_RAD + j, b = i * ARC_RAD + (j + 1) % ARC_RAD, c = a + ARC_RAD, d = b + ARC_RAD; if (span > 0) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
}
const ARC_SPAN = 1.05, ARC_GAP = 0.12;
const railM = new THREE.MeshStandardMaterial({ color: 0x1a140e, metalness: 0.7, roughness: 0.45, transparent: true, opacity: 0.9, fog: false, side: THREE.DoubleSide });
const lightM = (c: number) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.75, metalness: 0.15, roughness: 0.28, transparent: true, opacity: 1, fog: false, side: THREE.DoubleSide });
/* fôlego à direita da direção da câmera (enche do meio para fora), vida à esquerda (esvazia da ponta de fora para o meio) */
const stamArc = new THREE.Mesh(arcTube(1.02, 0.042, -Math.PI / 2 + ARC_GAP / 2 + ARC_SPAN, -ARC_SPAN), lightM(0xf4f0e6)); stamArc.renderOrder = 5; stamG.add(stamArc);
const stamBg = new THREE.Mesh(arcTube(1.02, 0.054, -Math.PI / 2 + ARC_GAP / 2 - 0.012, ARC_SPAN + 0.024), railM); stamBg.renderOrder = 4; stamBg.position.y = -0.03; stamG.add(stamBg);
const hpArc = new THREE.Mesh(arcTube(1.02, 0.042, -Math.PI / 2 - ARC_GAP / 2 - ARC_SPAN, ARC_SPAN), lightM(0xd83a3a)); hpArc.renderOrder = 5; stamG.add(hpArc);
const hpBg = new THREE.Mesh(arcTube(1.02, 0.054, -Math.PI / 2 - ARC_GAP / 2 - ARC_SPAN - 0.012, ARC_SPAN + 0.024), railM); hpBg.renderOrder = 4; hpBg.position.y = -0.03; stamG.add(hpBg);
for (const m of [stamArc, stamBg, hpArc, hpBg]) { m.frustumCulled = false; m.raycast = () => {}; }
/* 11/11 (Erling: "ficou uma sobra preta; diminui e ganha mais elegância"): o trilho era um tubo cheio, mais grosso e mais baixo que a luz: de lado aparecia como uma segunda barra preta. Agora é uma calha rasa (30% da altura) colada embaixo da luz, só um fio escuro de contorno */
for (const m of [stamBg, hpBg]) { m.scale.y = 0.3; m.position.y = -0.022; }
const arcFill = (m: THREE.Mesh, k: number) => m.geometry.setDrawRange(0, Math.round(Math.max(0, Math.min(1, k)) * ARC_SEG) * ARC_RAD * 6);
let stamShow = 0;
function updateStamRing(dt: number) {
  const k = K.game.st.stam / Math.max(1, K.game.st.stamMax), want = 1; /* 26/10 (Erling): o fôlego não some — fica sempre no pé, cheio ou não */
  stamShow += (want - stamShow) * Math.min(1, dt * 4); stamG.visible = stamShow > 0.02 && !K.inside && !K.game.st.dead && !heroBehind();
  if (!stamG.visible) return;
  stamG.position.set(K.heroPos.x, K.heroPos.y + 0.12, K.heroPos.z); stamG.rotation.y = K.az; /* 03/11 (Erling: "a aura do personagem não se esconde atrás dos itens"): as barras e a bússola agora respeitam a profundidade — somem atrás da fonte, de casas e de pedras; um palmo acima do chão e um empurrão de profundidade mínimo (04/11: o empurrão grande punha o anel por cima de bichos, baús e pedras) */ // arco virado para a câmera, à frente dos pés
  arcFill(stamArc, k); { const m = stamArc.material as THREE.MeshStandardMaterial; m.color.setHex(k < 0.25 ? 0xffb0a0 : 0xf4f0e6); m.emissive.copy(m.color); m.opacity = stamShow; }
  const kh = K.game.st.hp / Math.max(1, K.game.st.hpMax);
  arcFill(hpArc, kh); { const m = hpArc.material as THREE.MeshStandardMaterial; m.color.setHex(kh < 0.3 ? 0xff5a3a : 0xd83a3a); m.emissive.copy(m.color); m.emissiveIntensity = kh < 0.3 ? 0.75 + 0.35 * Math.sin(performance.now() / 160) : 0.75; m.opacity = stamShow; }
  railM.opacity = 0.9 * stamShow;
}
/* bússola no pé do herói: arco dourado que aponta o destino, com três chevrons correndo na direção */
const guide3d = new THREE.Group(); guide3d.visible = false; K.scene.add(fine(guide3d));
/* 27/10 (Erling): segunda bússola — outra missão guiada, de outra cor (história + extra/mundo), lado a lado no pé do herói */
const guide3dB = new THREE.Group(); guide3dB.visible = false; K.scene.add(fine(guide3dB));
/* mistura normal (não aditiva): no chão claro, verde-claro e laranja somados à luz viravam quase branco — a cor da missão tem que aparecer como é */
const gMat = (op: number) => new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: op, depthWrite: false, depthTest: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2, blending: THREE.NormalBlending, fog: false, toneMapped: false, side: THREE.DoubleSide });
/* 26/10 (Erling: "a bússola some no chão da floresta, precisa ficar mais viva"): desenhada por cima do chão e da grama (sem teste de profundidade),
   com uma sombra escura por baixo do arco e das setas — a cor da missão lê em qualquer fundo — e pulsando */
const gInk = (op: number) => new THREE.MeshBasicMaterial({ color: 0x050403, transparent: true, opacity: op, depthWrite: false, depthTest: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2, fog: false, side: THREE.DoubleSide, userData: { ink: true } } as THREE.MeshBasicMaterialParameters);
/* 07/11 (Erling: "as bússolas estão grandes demais; têm que ter a espessura da barra de vida e do fôlego, mais elegantes e no lugar certo"):
   cada bússola é um anel fino (0,10 m, como as barras) em volta das barras — a 1ª logo por fora (raio 1,19), a 2ª por fora dela (1,32) —,
   e as setinhas pequenas correm por fora de tudo, a partir de 1,48 m */
const GR = [1.19, 1.32], CHEV0 = 1.48;
/* 09/11 (Erling, foto: "muito grande, incomoda; começa com uma seta 50% menor que a atual, depois 35% menor e depois 25% menor, e um pouco mais
   brilhantes, a azul e a amarela"): a seta nasce com metade do tamanho de antes (1,9 → 0,95), passa por 65% no meio do caminho e chega a 75%
   no fim; a opacidade quase não cai no caminho e a sombra por baixo ficou mais leve, para a cor brilhar */
const CHEV_BASE = 1.9;
const chevK = (k: number) => CHEV_BASE * (k < 0.5 ? 0.5 + 0.3 * k : 0.65 + 0.2 * (k - 0.5));
const chevOp = (k: number) => Math.min(1, Math.min(1, k * 5) * (1 - Math.max(0, k - 0.75) * 4));
for (const [gi, gg] of [guide3d, guide3dB].entries()) { const r0 = GR[gi]; const ink = new THREE.Mesh(new THREE.RingGeometry(r0 - 0.07, r0 + 0.07, 48, 1, -Math.PI / 2 - 0.52, 1.04).rotateX(-Math.PI / 2), gInk(0.5)); ink.renderOrder = 6; ink.userData.ink = true; gg.add(ink);
  const arc2 = new THREE.Mesh(new THREE.RingGeometry(r0 - 0.05, r0 + 0.05, 48, 1, -Math.PI / 2 - 0.5, 1.0).rotateX(-Math.PI / 2), gMat(1)); arc2.name = 'garc'; arc2.renderOrder = 7; gg.add(arc2);
  for (let i = 0; i < 3; i++) { const sh = new THREE.Shape(); sh.moveTo(-0.11, -0.07); sh.lineTo(0, 0.05); sh.lineTo(0.11, -0.07); sh.lineTo(0, -0.02); sh.closePath();
    const sh2 = new THREE.Shape(); sh2.moveTo(-0.14, -0.09); sh2.lineTo(0, 0.075); sh2.lineTo(0.14, -0.09); sh2.lineTo(0, -0.04); sh2.closePath();
    const ch = new THREE.Mesh(new THREE.ShapeGeometry(sh).rotateX(Math.PI / 2), gMat(1)); ch.name = 'chev' + i; ch.renderOrder = 9; const chi = new THREE.Mesh(new THREE.ShapeGeometry(sh2).rotateX(Math.PI / 2), gInk(0.5)); chi.renderOrder = 8; chi.userData.ink = true; chi.position.y = -0.002; ch.add(chi); gg.add(ch); } }
let guideT: { x: number; y: number; label: string } | null = null, guideTick = 0;
const guideZoomK = () => Math.min(2.6, Math.max(1, K.camera.position.distanceTo(K.heroPos) / 30));
/** cor da guia = cor da missão escolhida (história amarela, secundária azul, quadro verde, evento laranja, alfinete do mapa prata-azulado):
 *  o arco, as setas no chão, a etiqueta e o anel no mapa falam a mesma cor do cartão da missão (Erling, 25/10) */
const GUIDE_COL = { story: '#ffdc3a', side: '#5cc0ff', rep: '#2ee05a', ev: '#ff7a14', pin: '#c8d2e8' } as const;
let guideCol: string = GUIDE_COL.story;
function guideColor(): string { if (pinT) return GUIDE_COL.pin; if (guideT && /^Evento: /.test(guideT.label)) return GUIDE_COL.ev; const d = K.quests.tracked; return d ? GUIDE_COL[questCat(d)] : GUIDE_COL.story; }
const gv = new THREE.Vector3();
/* 09/11 (Erling: "a bússola some dependendo do terreno da floresta — a seta tem que acompanhar o solo e nunca sumir"): cada seta
   pousa na altura do chão onde ela está (subida, descida, raiz), e não some mais quando o herói passa sob as copas */
function groundY(g: THREE.Object3D, lz: number) { const s = Math.sin(g.rotation.y), c = Math.cos(g.rotation.y), x = g.position.x + s * lz, z = g.position.z + c * lz;
  const d = heightAt(x, z) - heightAt(g.position.x, g.position.z); return Math.max(-1.5, Math.min(1.5, d)); }
function updateGuide(dt: number) {
  guideTick -= dt; if (guideTick <= 0) { guideTick = 0.5; guideT = questTarget(); { const c = guideColor(); if (c !== guideCol) { guideCol = c; guide3d.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined; if (m?.color && !o.userData.ink) m.color.set(c); }); guideEl.style.setProperty('--gc', c); } } const dir = document.querySelector('#quests .q.track .dir') as HTMLElement | null; if (dir) { if (guideT) { const dx = guideT.x - K.state.fx, dy = guideT.y - K.state.fy, m = Math.round(Math.hypot(dx, dy) * T); const comp = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'][((Math.round(Math.atan2(dx, -dy) / (Math.PI / 4)) % 8) + 8) % 8]; dir.textContent = `◆ ${guideT.label} · ${K.fmtDist(m)} ${comp}`; } else dir.textContent = ''; } }
  updateGuideB(performance.now() / 1000);
  if (!guideT || K.inside || K.dlg.isOpen) { guideEl.style.display = 'none'; guide3d.visible = false; return; }
  const tx = guideT.x * T, tz = guideT.y * T, hx = K.state.fx * T, hz = K.state.fy * T, dist = Math.hypot(tx - hx, tz - hz);
  if (dist < 5) { guideEl.style.display = 'none'; guide3d.visible = false; return; }
  const ang = Math.atan2(tx - hx, tz - hz), t = performance.now() / 1000;
  guide3d.visible = true; guide3d.position.set(K.heroPos.x, K.heroPos.y + 0.12, K.heroPos.z); guide3d.rotation.y = ang; const GG = guide3d; { const ga = guide3d.getObjectByName('garc')!; ga.position.y = groundY(GG, GR[0]); guide3d.children.forEach((c) => { if (c.userData.ink && !c.parent?.name.startsWith('chev')) c.position.y = ga.position.y; }); }
  /* 09/11 (Erling: "a marcação no chão de onde eu tenho que ir tem que ser mais visível; jogando de longe não se vê"): as setas ficaram maiores,
     mais fortes, correm mais longe e crescem junto com a distância da câmera */
  const zs = guideZoomK();
  for (let i = 0; i < 3; i++) { const ch = guide3d.getObjectByName('chev' + i) as THREE.Mesh; const k = ((t * 0.9 + i / 3) % 1); { const lz = CHEV0 + (0.1 + k * 1.3) * zs; ch.position.set(0, groundY(GG, lz) + 0.01 + i * 0.002, lz); } ch.scale.setScalar(chevK(k) * zs); const op = chevOp(k); (ch.material as THREE.MeshBasicMaterial).opacity = op; ((ch.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.35 * op; }
  { const ga = guide3d.getObjectByName('garc') as THREE.Mesh; (ga.material as THREE.MeshBasicMaterial).opacity = 0.95; ga.scale.setScalar(1); } /* 28/10 (Erling): o arco da bússola fica parado, sem pulsar */
  // etiqueta acima da ponta do arco: destino e distância
  const r = K.canvas.getBoundingClientRect();
  // contagem no canto inferior direito do personagem (onde ficarão os ícones de buffs/debuffs)
  gv.set(K.heroPos.x, K.heroPos.y + 0.1, K.heroPos.z).project(K.camera);
  guideEl.style.display = 'block'; guideEl.style.transform = `translate(${r.left + (gv.x * 0.5 + 0.5) * r.width + 34}px, ${r.top + (-gv.y * 0.5 + 0.5) * r.height + 6}px)`;
  guideLbl.textContent = guideT.label.replace(/^Entregar a /, '').replace(/^Falar com /, ''); guideDist.textContent = K.fmtDist(dist);
}
let guideTB: { x: number; y: number; label: string } | null = null, guideColB = '', guideTickB = 0;
function updateGuideB(t: number) {
  guideTickB -= 1 / 60; if (guideTickB <= 0) { guideTickB = 0.5; const d2 = K.quests.tracked2; guideTB = d2 ? questTarget(d2, false) : null; const c = d2 ? GUIDE_COL[questCat(d2)] : ''; if (c && c !== guideColB) { guideColB = c; guide3dB.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined; if (m?.color && !o.userData.ink) m.color.set(c); }); } }
  if (!guideTB || K.inside || K.dlg.isOpen) { guide3dB.visible = false; return; }
  const tx = guideTB.x * T, tz = guideTB.y * T, hx = K.state.fx * T, hz = K.state.fy * T, dist = Math.hypot(tx - hx, tz - hz); if (dist < 5) { guide3dB.visible = false; return; }
  guide3dB.visible = true; guide3dB.position.set(K.heroPos.x, K.heroPos.y + 0.12, K.heroPos.z); guide3dB.rotation.y = Math.atan2(tx - hx, tz - hz); const GG = guide3dB; { const ga = guide3dB.getObjectByName('garc')!; ga.position.y = groundY(GG, GR[1]); guide3dB.children.forEach((c) => { if (c.userData.ink) c.position.y = ga.position.y; }); } /* 07/11: a 2ª bússola tem o anel próprio (raio 1,32), sem encolher o grupo */
  const zs = guideZoomK();
  for (let i = 0; i < 3; i++) { const ch = guide3dB.getObjectByName('chev' + i) as THREE.Mesh; const k = ((t * 0.9 + i / 3) % 1); { const lz = CHEV0 + (0.1 + k * 1.3) * zs; ch.position.set(0, groundY(GG, lz) + 0.01 + i * 0.002, lz); } ch.scale.setScalar(chevK(k) * zs); const op = chevOp(k); (ch.material as THREE.MeshBasicMaterial).opacity = op; ((ch.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.35 * op; }
  { const ga = guide3dB.getObjectByName('garc') as THREE.Mesh; (ga.material as THREE.MeshBasicMaterial).opacity = 0.75 + 0.15 * Math.sin(t * 4 + 1); }
}
function hereT() { return K.inside ? K.inside.ret : { x: K.state.fx, y: K.state.fy }; }
function heroArrow(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI - K.hero.root.rotation.y); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -6 * s); ctx.lineTo(4.5 * s, 5 * s); ctx.lineTo(0, 2.5 * s); ctx.lineTo(-4.5 * s, 5 * s); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
/* MAPA DA MASMORRA (Erling, 26/10: "estou dentro de uma dungeon e o minimapa não muda, nem o mapa"): dentro, os dois mapas
   mostram a masmorra — salas por tipo, o portão do chefe, baús, a saída, os bichos vivos por perto — e o que você ainda não viu fica no escuro */
let dgMap: { key: string; cv: HTMLCanvasElement; seen: Uint8Array; W: number; D: number } | null = null;
const DG_PX = 4; /* pixels por metro no desenho base */
function dgMapFor(int: DungeonFloor, key: string) {
  if (dgMap && dgMap.key === key) return dgMap;
  const W = Math.ceil(int.W), D = Math.ceil(int.D), cv = document.createElement('canvas'); cv.width = W * DG_PX; cv.height = D * DG_PX; const g = cv.getContext('2d')!;
  const th = int.theme, floor = th === 'gelo' ? '#8aa0b4' : th === 'magma' ? '#8a5a40' : th === 'mata' || th === 'toca' ? '#8a7656' : th === 'arquivo' ? '#9a8462' : '#80786e';
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (int.free(x + 0.5, z + 0.5)) { g.fillStyle = floor; g.fillRect(x * DG_PX, z * DG_PX, DG_PX, DG_PX); }
  const RC: Record<string, string> = { boss: 'rgba(200,40,40,.28)', elite: 'rgba(230,150,40,.22)', side: 'rgba(120,160,230,.18)', pack: 'rgba(0,0,0,0)', entry: 'rgba(120,220,120,.25)' };
  for (const r of int.rooms) { const c = RC[r.kind]; if (!c) continue; g.fillStyle = c; g.fillRect((r.x - r.w / 2) * DG_PX, (r.z - r.d / 2) * DG_PX, r.w * DG_PX, r.d * DG_PX); }
  /* borda clara nas paredes */ const im = g.getImageData(0, 0, cv.width, cv.height), dd = im.data, Wp = cv.width; const out = new Uint8ClampedArray(dd);
  for (let y = 1; y < cv.height - 1; y++) for (let x = 1; x < Wp - 1; x++) { const i = (y * Wp + x) * 4; if (dd[i + 3]) continue; if (dd[i + 7] || dd[i - 1] || dd[i + Wp * 4 + 3] || dd[i - Wp * 4 + 3]) { out[i] = 190; out[i + 1] = 170; out[i + 2] = 130; out[i + 3] = 255; } }
  g.putImageData(new ImageData(out, cv.width, cv.height), 0, 0);
  dgMap = { key, cv, seen: new Uint8Array(W * D), W, D }; return dgMap;
}
function dgMapMarks(ctx: CanvasRenderingContext2D, int: DungeonFloor, X: (x: number) => number, Y: (z: number) => number, s: number) {
  const ic = (g: string, x: number, z: number, sz: number) => { ctx.font = `${sz}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(g, X(x), Y(z)); };
  const M = dgMap!; const seen = (x: number, z: number) => M.seen[Math.max(0, Math.min(M.D - 1, Math.floor(z))) * M.W + Math.max(0, Math.min(M.W - 1, Math.floor(x)))];
  ic('🚪', int.entry.x, int.entry.z, 12 * s);
  if (int.gate && seen(int.gate.x, int.gate.z)) ic(int.gate.opened ? '🔓' : '🔒', int.gate.x, int.gate.z, 12 * s);
  if (seen(int.boss.x, int.boss.z) || int.gate?.opened) ic('💀', int.boss.x, int.boss.z, 15 * s);
  const run = K.dgs.run; int.chests.forEach((c, i) => { if (seen(c.x, c.z) && !run?.opened.has(i)) ic('📦', c.x, c.z, 10 * s); });
  for (const e of K.game.enemies.list) { if (!e.alive || !(e as { tag?: string }).tag?.startsWith('dg')) continue; const lx = e.pos.x - K.IX, lz = e.pos.z - K.IZ; if (!seen(lx, lz)) continue; const big = e === run?.boss;
    ctx.beginPath(); ctx.arc(X(lx), Y(lz), (big ? 4 : 2.2) * s, 0, 6.283); ctx.fillStyle = big ? '#ff3a2a' : '#ff8a6a'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#2a0a06'; ctx.stroke(); }
}
function dgReveal(lx: number, lz: number) { const M = dgMap; if (!M) return; const R = 9; for (let z = Math.floor(lz - R); z <= lz + R; z++) for (let x = Math.floor(lx - R); x <= lx + R; x++) { if (x < 0 || z < 0 || x >= M.W || z >= M.D) continue; if ((x - lx) ** 2 + (z - lz) ** 2 < R * R) M.seen[z * M.W + x] = 1; } }
/** desenha a masmorra no canvas (o que não foi visto fica escuro) */
function dgDraw(ctx: CanvasRenderingContext2D, int: DungeonFloor, cx: number, cz: number, k: number, Wc: number, Hc: number) {
  const M = dgMapFor(int, K.inside!.dg! + int.W + 'x' + int.D); const lx = K.state.fx * T - K.IX, lz = K.state.fy * T - K.IZ; dgReveal(lx, lz);
  const X = (x: number) => Wc / 2 + (x - cx) * k, Y = (z: number) => Hc / 2 + (z - cz) * k;
  ctx.fillStyle = '#07060a'; ctx.fillRect(0, 0, Wc, Hc); ctx.imageSmoothingEnabled = false; ctx.drawImage(M.cv, X(0), Y(0), M.W * k, M.D * k);
  ctx.fillStyle = 'rgba(7,6,10,.8)'; for (let z = 0; z < M.D; z++) { let run0 = -1; for (let x = 0; x <= M.W; x++) { const un = x < M.W && !M.seen[z * M.W + x]; if (un && run0 < 0) run0 = x; else if (!un && run0 >= 0) { ctx.fillRect(X(run0), Y(z), (x - run0) * k + 0.5, k + 0.5); run0 = -1; } } }
  dgMapMarks(ctx, int, X, Y, Math.max(0.8, Math.min(1.6, k / 3)));
  heroArrow(ctx, X(lx), Y(lz), Math.max(1, Math.min(1.6, k / 3)));
}
let mmZoom = (() => { try { return Math.max(0.5, Math.min(4, +(localStorage.getItem('karmika.minizoom') || 1) || 1)); } catch { return 1; } })();
function drawMini() {
  if (K.inside?.dg) { const int = K.inside.int as DungeonFloor, D = K.mmEl.width, C = D / 2; K.mg.save(); K.mg.clearRect(0, 0, D, D); K.mg.beginPath(); K.mg.arc(C, C, C, 0, 6.283); K.mg.clip(); dgDraw(K.mg, int, K.state.fx * T - K.IX, K.state.fy * T - K.IZ, D / 40 * mmZoom, D, D); K.mg.restore(); return; }
  const S = 2.4 * mmZoom, h0 = hereT(), D = K.mmEl.width, C = D / 2; K.mg.save(); K.mg.imageSmoothingEnabled = false; K.mg.clearRect(0, 0, D, D); K.mg.beginPath(); K.mg.arc(C, C, C, 0, 6.283); K.mg.clip(); K.mg.fillStyle = '#0a0810'; K.mg.fillRect(0, 0, D, D);
  K.mg.drawImage(K.mmBase, C - h0.x * S, C - h0.y * S, K.MMS * S, K.MMS * S); K.markers(K.mg, (x) => C + (x - h0.x) * S, (y) => C + (y - h0.y) * S, 0.9, false); if (mmZoom >= 1.4) K.miniIcons(K.mg, (x) => C + (x - h0.x) * S, (y) => C + (y - h0.y) * S, S, D); { /* 09/11: item poderoso no chão — losango pulsando na cor da raridade */ const pu = 0.6 + 0.4 * Math.sin(performance.now() / 180);
    for (const m of (K.game as unknown as { lootMarks?: () => { x: number; z: number; col: string }[] }).lootMarks?.() ?? []) { const x = C + (m.x / T - h0.x) * S, y = C + (m.z / T - h0.y) * S, r = 4 + 2 * pu;
      K.mg.save(); K.mg.translate(x, y); K.mg.rotate(Math.PI / 4); K.mg.globalAlpha = 0.35 * pu; K.mg.fillStyle = m.col; K.mg.fillRect(-r - 3, -r - 3, (r + 3) * 2, (r + 3) * 2); K.mg.globalAlpha = 1; K.mg.fillRect(-r / 2, -r / 2, r, r); K.mg.strokeStyle = '#fff'; K.mg.lineWidth = 1; K.mg.strokeRect(-r / 2, -r / 2, r, r); K.mg.restore(); } }
  heroArrow(K.mg, C, C, 1); K.mg.restore();
}
let seaPat: CanvasPattern | null = null;
/* 07/11: cópia do mapa com as bordas esmaecendo — o mar desenhado vira só a água da carta, sem retângulo em volta */
let soft: HTMLCanvasElement | null = null;
function softBase(src: HTMLCanvasElement) { if (soft) return soft; soft = document.createElement('canvas'); soft.width = src.width; soft.height = src.height;
  const g = soft.getContext('2d')!, W = soft.width, H = soft.height, F = W * 0.16; g.drawImage(src, 0, 0); const im = g.getImageData(0, 0, W, H), d = im.data;
  /* só a água esmaece (terra das ilhas da beirada fica inteira); a borda some num degradê largo */
  for (let y = 0; y < H; y++) { const ey = Math.min(y, H - 1 - y); for (let x = 0; x < W; x++) { const e = Math.min(ey, x, W - 1 - x); if (e >= F) continue; const o = (y * W + x) * 4, r = d[o], gg = d[o + 1], b = d[o + 2];
    if (b > r + 12 && b >= gg) { const u = e / F; d[o + 3] = Math.round(d[o + 3] * u * u * (3 - 2 * u)); } } }
  g.putImageData(im, 0, 0); return soft; }
function drawBig() {
  if (K.inside?.dg) { const int = K.inside.int as DungeonFloor, W = K.bmEl.width, H = K.bmEl.height, k = Math.min(W / (int.W + 8), H / (int.D + 8)); dgDraw(K.bg, int, int.W / 2, int.D / 2, k, W, H); K.bg.font = '600 18px Cinzel, Georgia, serif'; K.bg.textAlign = 'center'; K.bg.fillStyle = '#ffe08a'; K.bg.fillText(K.dgs.run?.d.name ?? 'Masmorra', W / 2, 28); K.bg.font = '12px Georgia, serif'; K.bg.fillStyle = '#c8b898'; K.bg.fillText('🚪 saída · 🔒 portão do chefe · 💀 chefe · 📦 baú · ● bichos vistos — o escuro é o que você ainda não andou', W / 2, H - 14); K.mapHits = []; return; }
  K.mapV.z = Math.max(K.mapV.z, K.mapZMin());
  const W = K.bmEl.width, H = K.bmEl.height, k = K.pxPerTile(), L = K.mapV.layers;
  { /* 07/11: o centro só anda até a borda do mapa encostar na moldura; se o mapa inteiro cabe (zoom mínimo), fica no meio */ const hw = W / 2 / k, hh = H / 2 / k;
    const pad = MAP_W * 0.07; /* 07/11: dá para passar um pouco da borda, para os nomes e os bichos da beirada (Trono de Cinzas, Picos) não ficarem cortados */
    /* 07/11: dá para arrastar até a beirada do mapa chegar perto do meio da tela — as ilhas da borda ficam visíveis */
    const lim = (c: number, h: number) => { if (h * 2 >= MAP_W * 0.98) return MAP_W / 2; const lo = Math.min(h - pad, MAP_W * 0.22), hi = Math.max(MAP_W - h + pad, MAP_W * 0.78); return lo > hi ? MAP_W / 2 : THREE.MathUtils.clamp(c, lo, hi); };
    K.mapV.cx = lim(K.mapV.cx, hw); K.mapV.cy = lim(K.mapV.cy, hh); }
  const X = (x: number) => W / 2 + (x - K.mapV.cx) * k, Y = (y: number) => H / 2 + (y - K.mapV.cy) * k;
  /* 07/11: a carta náutica — o mar enche a tela inteira (a mesma trama além do quadrado do mundo), e por cima do mar a arte dos tecnocratas */
  K.bg.imageSmoothingEnabled = false; seaPat ??= oceanPattern(K.bg); if (seaPat) { try { seaPat.setTransform(new DOMMatrix().translateSelf(X(0), Y(0)).scaleSelf(Math.max(0.35, k / 2))); } catch { /* */ } K.bg.fillStyle = seaPat; } else K.bg.fillStyle = '#1d3f6a'; K.bg.fillRect(0, 0, W, H);
  K.bg.drawImage(softBase(K.mmBase as HTMLCanvasElement), X(0), Y(0), MAP_W * k, MAP_W * k); drawSeaArt(K.bg, X, Y, k, K.mapV.z, W, H, performance.now() / 1000);
  K.bg.fillStyle = 'rgba(10,8,4,.18)'; K.bg.fillRect(0, 0, W, H);
  K.mapHits = []; const placed: [number, number, number, number][] = [];
  const label = (txt: string, x: number, y: number, size: number, col: string, force = false) => { K.bg.font = `600 ${size}px Cinzel, Georgia, serif`; const w = K.bg.measureText(txt).width, bx: [number, number, number, number] = [x - w / 2 - 2, y - size, w + 4, size + 4];
    if (!force && placed.some((p) => bx[0] < p[0] + p[2] && bx[0] + bx[2] > p[0] && bx[1] < p[1] + p[3] && bx[1] + bx[3] > p[1])) return; placed.push(bx);
    K.bg.textAlign = 'center'; K.bg.lineWidth = 3.5; K.bg.strokeStyle = 'rgba(0,0,0,.85)'; K.bg.strokeText(txt, x, y); K.bg.fillStyle = col; K.bg.fillText(txt, x, y); };
  const icon = (glyph: string, x: number, y: number, s: number, ring: string) => { K.bg.beginPath(); K.bg.arc(x, y, s, 0, 6.283); K.bg.fillStyle = 'rgba(16,12,6,.9)'; K.bg.fill(); K.bg.lineWidth = 2; K.bg.strokeStyle = ring; K.bg.stroke(); K.bg.font = `${s * 1.15}px serif`; K.bg.textAlign = 'center'; K.bg.textBaseline = 'middle'; K.bg.fillStyle = '#fff'; K.bg.fillText(glyph, x, y + 1); K.bg.textBaseline = 'alphabetic'; };
  const s0 = 7 + K.mapV.z * 1.3;
  /* 07/11 (Erling: "um zoom da região e um mapa global vendo tudo"): de longe (mapa do mundo) só as regiões com o nível, as cidades e as relíquias; o resto aparece ao aproximar */
  const far = K.mapV.z < 1.8;
  { // regiões: fronteiras pontilhadas e o nome com a faixa de nível dos bichos (cor = perigo para o seu nível)
    const st = 3; K.bg.fillStyle = 'rgba(255,236,190,.38)';
    for (let ty = 0; ty < MAP_W; ty += st) for (let tx = 0; tx < MAP_W; tx += st) { if (K.city.map[ty]?.[tx] === 'water') continue; /* 07/11: fronteira de região só em terra (no mar parecia estrada) */ const a = regionAt(tx, ty); if (regionAt(tx + st, ty) !== a || regionAt(tx, ty + st) !== a) { const x = X(tx + st / 2), y = Y(ty + st / 2); if (x > -4 && y > -4 && x < W + 4 && y < H + 4) K.bg.fillRect(x - 1, y - 1, 2.2, 2.2); } }
    for (const rg of REGIONS) { const x = X(rg.x), y = Y(rg.y - 16) - s0 * 2.6, lv = K.game.st.lvl, c = rg.lo > lv + 3 ? '#ff8a7a' : rg.hi < lv - 2 ? '#a8a8a8' : '#ffe08a';
      if (K.mapV.z < 0.9) { if (rg.id > 40) label(rg.name.toUpperCase(), X(rg.x), Y(rg.y) - 10, 10, 'rgba(255,214,170,.9)', true); continue; } /* 07/11: o mundo inteiro — só os nomes das ilhas (e o do continente, lá embaixo); o resto aparece ao aproximar */
      K.bg.font = `italic 600 ${11 + K.mapV.z * 2.2}px Cinzel, Georgia, serif`; label(rg.name.toUpperCase(), x, y, 11 + K.mapV.z * 2.2, 'rgba(240,226,190,.8)', true); label(`Nv ${rg.lo}–${rg.hi}${rg.lo > lv + 3 ? ' · ☠' : ''}`, x, y + 13 + K.mapV.z * 2, 10 + K.mapV.z * 1.4, c, true); } }
  if (K.mapV.z < 0.9) label('CONTINENTE DE KARMIKA', X(CITY.x), Y(CITY.y) - 30, 13, 'rgba(255,236,190,.85)', true);
  if (L.town) for (const st of K.city.settlements) { const big = st.name === 'Askavik', x = X(st.x), y = Y(st.y); if (far && !big && st.kind !== 'city') { K.bg.beginPath(); K.bg.arc(x, y, 2.6, 0, 6.283); K.bg.fillStyle = '#f0e6cc'; K.bg.fill(); K.bg.lineWidth = 1; K.bg.strokeStyle = '#000'; K.bg.stroke(); K.mapHits.push({ x, y, r: 6, name: st.name, sub: 'Vila' }); continue; } icon(big ? '🏰' : '🏠', x, y, big ? s0 * 1.35 : s0, big ? '#ffd24a' : '#c9a24a'); label(st.name, x, y - s0 - 4, big ? 15 : 12, big ? '#ffe08a' : '#f0e6cc', big); K.mapHits.push({ x, y, r: s0 + 3, name: st.name, sub: big ? 'Cidade média' : 'Vila' }); }
  if (L.town && !far) { const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 220); for (const m of K.caravans.mapMarks()) { const x = X(m.x), y = Y(m.y); if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
      const ev = m.kind === 'ev' || m.kind === 'res'; if (ev) { K.bg.beginPath(); K.bg.arc(x, y, s0 + 4 + pulse * 4, 0, 6.283); K.bg.strokeStyle = `rgba(255,90,60,${0.5 + pulse * 0.4})`; K.bg.lineWidth = 2.5; K.bg.stroke(); }
      icon(ev ? '🛞' : '⚙', x, y, s0 * (ev ? 0.95 : m.kind === 'esc' ? 0.9 : 0.7), ev ? '#ff6a4a' : m.kind === 'esc' ? '#ffd24a' : '#e0b048'); if (ev || m.kind === 'esc' || K.mapV.z >= 3) label(m.name, x, y - s0 - 3, 10, ev ? '#ffb0a0' : '#f0d890'); K.mapHits.push({ x, y, r: s0 + 3, name: m.name, sub: m.sub }); } }
  for (const em of K.eventos.mapMarks(hereT())) { const x = X(em.x), y = Y(em.y), pr = 0.5 + 0.5 * Math.sin(performance.now() / 260); K.bg.beginPath(); K.bg.arc(x, y, Math.max(s0 + 6, em.r * k), 0, 6.283); K.bg.strokeStyle = em.color; K.bg.globalAlpha = 0.35 + pr * 0.4; K.bg.lineWidth = 2.5; K.bg.stroke(); K.bg.globalAlpha = 1; icon(em.icon, x, y, s0 * 1.1, em.color); label(em.name, x, y - s0 - 5, 12, em.color, true); K.mapHits.push({ x, y, r: s0 + 4, name: em.name, sub: em.sub }); }
  const dgList = (() => { try { return K.dgs.entrances; } catch { return []; } })(); // (as masmorras nascem depois do mapa)
  if (L.poi && !far) { const PICON = (n: string) => /Catedral|Igreja|Templo/.test(n) ? '⛪' : /Cemit|Cripta|Mausol/.test(n) ? '✝' : /Covil|Clareira|Garganta|Toca/.test(n) ? '🐺' : /Ruína/.test(n) ? '🏛' : /Mercado/.test(n) ? '⚖' : /Escola|Forja|Academia/.test(n) ? '📜' : '◆';
    for (const p of K.city.pois) { if (K.city.settlements.some((st) => st.name === p.name)) continue; if (p.secret && !secretKnown(p.name)) continue; if (K.mapV.z < 2.2 && /Mercado|Escola|Forja|Academia|Parque|Igreja Kármica|Cemitério de Askavik|Catedral de Askavik/.test(p.name)) continue; const x = X(p.x), y = Y(p.y), dg = dgList.find((e) => e.d.name === p.name); if (dg) { const grp = dg.d.kind === 'grupo'; icon(dg.d.theme === 'cripta' ? '⚰' : grp ? '💀' : '🕳', x, y, s0 * (grp ? 1 : 0.85), grp ? '#ff6a5a' : '#c9a24a'); label(p.name, x, y + s0 + 12, 11, grp ? '#ffb0a0' : '#e8dcc0'); K.mapHits.push({ x, y, r: s0, name: p.name, sub: `${grp ? 'Masmorra' : dg.d.kind === 'subsolo' ? 'Subsolo' : 'Caverna'} · Nv ${dg.lvl[0]}–${dg.lvl[1]} · ${dg.d.players}` }); continue; } icon(PICON(p.name), x, y, s0 * 0.85, '#8a7a5a'); label(p.name, x, y + s0 + 12, 11, '#e8dcc0'); K.mapHits.push({ x, y, r: s0, name: p.name, sub: 'Lugar' }); } }
  if (L.serv && K.mapV.z >= 2.6) { /* ofícios e comércio dentro das vilas e cidades (23/10): bancadas de trabalho, lojas, correio, cofre, quadro */
    const sz = s0 * 0.6, withLabel = K.mapV.z >= 5.5;
    const put = (glyph: string, x0: number, y0: number, name: string, sub: string, ring: string) => { const x = X(x0), y = Y(y0); if (x < -20 || y < -20 || x > W + 20 || y > H + 20) return; icon(glyph, x, y, sz, ring); if (withLabel) label(name, x, y + sz + 10, 10, '#e8dcc0'); K.mapHits.push({ x, y, r: sz + 2, name, sub }); };
    for (const p of K.city.props) {
      if (p.kind === 'library' && p.variant === 2) put('🏛', p.gx + p.w / 2, p.gy + p.h / 2, p.label || 'Prefeitura', 'O Prefeito Corvin Aldmar: Licença de Guilda e o Livro de Guildas', '#ffd98a');
      else if (p.kind === 'library') put('📚', p.gx + p.w / 2, p.gy + p.h / 2, p.label || 'Biblioteca', p.variant ? 'Livros, mapas e o orbe dos magos' : 'O cronista, as estantes de dois andares e as três escadas dos subsolos', '#e6c46a');
      if (p.kind === 'station') { const si = STATION_INFO[p.variant ?? 0]; if (si) put(si.icon, p.gx + p.w / 2, p.gy + p.h / 2, p.label || si.name, `Lugar de trabalho · ${K.PROF_NAME[si.prof] ?? si.prof}`, '#8ab4d8'); }
      else if (p.kind === 'mailbox') put('📮', p.gx + 0.5, p.gy + 0.5, 'Correio', 'Cartas e encomendas', '#a0d8a0');
      else if (p.kind === 'vault') put('🏦', p.gx + p.w / 2, p.gy + p.h / 2, 'Cofre', 'Guarde itens e ouro', '#a0d8a0');
      else if (p.kind === 'noticeboard') put('📋', p.gx + 0.5, p.gy + 0.5, 'Quadro de Avisos', 'Contratos e missões', '#a0d8a0');
    }
    const SICON: Record<string, string> = { armeiro: '⚔', armaduras: '🛡', mercador: '⚖', mercador_cidade: '⚖', pocoes: '⚗', cervejaria: '🍺', churrasco: '🍖', charcutaria: '🥓', cozinha: '🍲', lenhador: '🪓', cacador: '🏹', construtor: '🔨', domador: '🐾', tec_fio: '🧶', tec_desf: '🧶', estabulo: '🐎', latao: '⚙' };
    for (const n of K.npcSys.npcs) { const key = K.SHOP_BY_NAME.get(n.def.name); if (!key) continue; const sd = SHOPDEF[key]; put(SICON[key] ?? '🪙', n.pos.x / T, n.pos.z / T, sd?.title ?? n.def.name, `Comércio${sd?.note ? ' · ' + sd.note : ''}`, '#d8b45a'); }
  }
  if (L.vista && !far) for (const v of K.CINE.vistas) { const seen = K.vistaSeen.has(v.id), x = X(v.at.x), y = Y(v.at.y); icon('👁', x, y, s0 * 0.85, seen ? '#ffd24a' : '#6a6a72'); K.mapHits.push({ x, y, r: s0, name: v.title.split(' — ')[1] ?? v.title, sub: seen ? 'Fonte da Visão (vista)' : 'Fonte da Visão — ainda não vista' }); }
  if (L.relic) for (const r of K.city.relics) { const known = K.knowsRelic(r.name), x = X(r.x), y = Y(r.y); K.bg.save(); K.bg.translate(x, y); K.bg.rotate(Math.PI / 4); K.bg.fillStyle = known ? '#8ad0ff' : '#c9a24a'; K.bg.strokeStyle = '#000'; K.bg.lineWidth = 2; const q = s0 * 0.7; K.bg.fillRect(-q, -q, q * 2, q * 2); K.bg.strokeRect(-q, -q, q * 2, q * 2); K.bg.restore(); if (known) { K.bg.beginPath(); K.bg.arc(x, y, s0 + 3 + Math.sin(performance.now() / 300) * 1.5, 0, 6.283); K.bg.strokeStyle = 'rgba(138,208,255,.6)'; K.bg.lineWidth = 1.5; K.bg.stroke(); }
    K.mapHits.push({ x, y, r: s0 + 2, name: r.name, sub: known ? 'Relíquia conhecida — clique para viajar' : 'Relíquia desconhecida — toque nela para lembrar', go: known ? r.name : undefined }); }
  if (L.npc) for (const n of K.npcSys.npcs) { K.bg.fillStyle = '#7ad0ff'; K.bg.beginPath(); K.bg.arc(X(n.pos.x / T), Y(n.pos.z / T), 2.4, 0, 6.283); K.bg.fill(); }
  if (guideT) { const x = X(guideT.x), y = Y(guideT.y), pr = 7 + 3 * Math.abs(Math.sin(performance.now() / 300)); K.bg.strokeStyle = guideCol; K.bg.lineWidth = 2.5; K.bg.beginPath(); K.bg.arc(x, y, pr, 0, 6.283); K.bg.stroke(); }
  const h0 = hereT(); heroArrow(K.bg, X(h0.x), Y(h0.y), 2.2);
  drawMapFrame(K.bg, W, H, performance.now() / 1000);
  (K.bigEl.querySelector('.mzone') as HTMLElement).textContent = zoneName();
}
/** 09/11: lugar secreto (esconderijo dos vampiros) só aparece para quem já foi levado lá ou tem uma missão que leva lá — e quem conta, trai */
function secretKnown(name: string): boolean { try { if ((JSON.parse(localStorage.getItem('karmika.segredos.v1') || '[]') as string[]).includes(name)) return true; } catch { /* */ }
  return Object.keys(K.quests.q.active).some((id) => K.quests.def(id)?.objs.some((o) => o.kind === 'visit' && o.poi === name)); }
function zoneName() { const h0 = hereT(); for (const st of K.city.settlements) if (Math.hypot(h0.x - st.x, h0.y - st.y) < st.radius) return st.name; if (Math.hypot(h0.x - CITY.x, h0.y - CITY.y) < 22) return 'Karmika'; let best: string | null = null, bd = 24; for (const p of K.city.pois) { if (p.secret && !secretKnown(p.name)) continue; const d = Math.hypot(p.x - h0.x, p.y - h0.y); if (d < bd) { bd = d; best = p.name; } } return best ?? K.BNAME[K.city.biome[Math.floor(h0.y)]?.[Math.floor(h0.x)] ?? 'meadow']; }
document.getElementById('btns')!.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('button') as HTMLElement | null; if (!b) return; const k = b.dataset.b; if (k === 'inv') { K.keys.clear(); K.inv.toggle(); } else if (k === 'char') { K.keys.clear(); K.inv.toggleChar(); } else if (k === 'map') K.toggleBigMap(); else if (k === 'menu') K.game.toggleMenu(); else if (k === 'god') window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' })); });
let mmT = 0;
const mouse = { x: K.city.spawn.x * T, z: K.city.spawn.y * T + 4 };
  return { mouse, hereT, get pinT() { return pinT; }, set pinT(v: typeof pinT) { pinT = v; }, zoneName, get mmZoom() { return mmZoom; }, set mmZoom(v: typeof mmZoom) { mmZoom = v; }, drawMini, drawBig, get guideT() { return guideT; }, get guideCol() { return guideCol; }, setPin, DROP_SRC, updateStamRing, updateGuide, get mmT() { return mmT; }, set mmT(v: typeof mmT) { mmT = v; } };
}
