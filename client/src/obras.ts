import { houseDoor } from './houses3d';
/** A obra inteira e a casa do jogador (28/10, Erling):
 *  - Canteiro: o terreno marcado com estacas e corda, pilhas de tábuas, tijolos de pedra, pregos, rolos de corda e galhos. A obra sobe
 *    em etapas (alicerce → esteios → paredes → telhado) e as pilhas DIMINUEM conforme o material é usado.
 *  - Trabalho: E perto da obra = uma martelada (o herói trabalha); com os Braços Mecânicos da Companhia ligados, a obra sobe sozinha
 *    (+1 martelada a cada 5 s), mesmo com o jogador longe.
 *  - Pronta: vira uma casa de verdade (prop 'house'), com porta. Por dentro: cama (descansar e curar), caixa de correio que guarda
 *    itens (o cofre), e a placa "Casa de (nome)" na frente. A porta só abre para o dono e o seu grupo.
 *  Salvo em localStorage (uma obra/casa por jogador, por enquanto). */
import * as THREE from 'three';
import { std } from './toon3d';
import type { Whole } from './build';

/** work = turnos de trabalho que a obra pede; done = turnos já trabalhados (fração). robot = o Ajudante de Obra plantado no canteiro. */
export interface HomeSave { id: string; name: string; gx: number; gy: number; w: number; h: number; work: number; done: number; signed: boolean; owner: string;
  /** antigo (um robô só) — migra para robots */ robot?: Robot;
  /** 28/10: até 4 Ajudantes de Obra ao mesmo tempo; cada um trabalha no seu canto do canteiro (slot 0..3) e soma turnos à obra */ robots?: Robot[];
  /** quando a escritura saiu (a carta do Cartório) */ deed?: number;
  /** o número da escritura (o item escritura_<deedId>) */ deedId?: string;
  /** 28/10: mobília e decoração colocadas — x,z em metros (dentro: no interior; fora: a partir do canto da casa), r = giro em 1/8 de volta, i = 1 dentro */ decor?: { id: string; x: number; z: number; r: number; i: number }[];
  /** 28/10: a licença da Companhia para usar Ajudantes nesta obra (um Contrato de Obra Automatizada por casa) */ contract?: boolean }
export interface Robot { tier: number; until: number; last: number; hp: number; dead?: number; slot: number }
export const MAX_ROBOTS = 4;
/** 1 turno de Karmika = 30 min reais; 6 turnos = 1 dia */
export const TURN_MS = 30 * 60 * 1000;
/* 28/10: a obra/casa tinha a MESMA chave da fonte-lar ('karmika.home.v1') e uma apagava a outra (o herói nascia em NaN e o jogo
   travava ao abrir). Agora é 'karmika.casa.v1'; o que estava na chave velha com cara de obra (gx/gy) muda para cá. */
const KEY = 'karmika.casa.v1', OLD = 'karmika.home.v1';
try { const o = JSON.parse(localStorage.getItem(OLD) || 'null'); if (o && typeof o.gx === 'number' && typeof o.gy === 'number') { if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, JSON.stringify(o)); localStorage.removeItem(OLD); } } catch { /* */ }
export const loadHome = (): HomeSave | null => { try { const h = JSON.parse(localStorage.getItem(KEY) || 'null'); return h && [h.gx, h.gy, h.w, h.h, h.work, h.done].every((v) => Number.isFinite(v)) ? h : null; } catch { return null; } };
/** quem ouve as mudanças da casa (o main.ts manda para o servidor) */
let onSaveFn: ((h: HomeSave | null) => void) | null = null;
export const onHomeSave = (f: (h: HomeSave | null) => void) => { onSaveFn = f; };
const saveHome = (h: HomeSave | null) => { try { if (h) localStorage.setItem(KEY, JSON.stringify(h)); else localStorage.removeItem(KEY); } catch { /* */ } try { onSaveFn?.(h); } catch { /* */ } };

export function createObras(ctx: { /** o modelo da casa pronta (para ela subir do chão durante a obra) */ siteModel?(h: HomeSave): THREE.Group | null; /** a variante do modelo da casa pronta (para achar a porta) */ variantOf?(h: HomeSave): number;
  scene: THREE.Scene; T: number; heightAt(x: number, z: number): number; log(t: string, c?: string): void;
  /** marca/desmarca a pegada como parede (colisão) */ block(gx: number, gy: number, w: number, h: number, on: boolean): void;
  /** a casa pronta entra no mundo como prop (e sai, se for demolida ou vendida) */ addHouse(h: HomeSave): void; removeHouse?(h: HomeSave): void;
  /** o Contrato de Obra Automatizada na mochila (a licença dos robôs) */ hasContract?(): boolean; takeContract?(): boolean;
  /** a casa ficou pronta (uma vez só): o main manda a carta do Cartório com a escritura */ onDone?(h: HomeSave): void;
  heroName(): string; particles: { spawn(x: number, y: number, z: number, o: Record<string, number>): void };
  /** Sentinelas de pé (x, z em metros; r = alcance; until = até quando) */ sentries(): { x: number; z: number; r: number; until: number }[];
  /** o som/efeito de uma martelada (opcional) */ hit?(x: number, z: number): void;
  /** um bicho vivo perto deste ponto? (só existe quando o herói está por perto) */ enemyNear(x: number, z: number, r: number): boolean;
  /** o herói está perto (os bichos da região estão simulados)? */ heroNear(x: number, z: number, r: number): boolean;
}) {
  const T = ctx.T; let home = loadHome(); let site: THREE.Group | null = null, sign: THREE.Group | null = null, robotT = 0, lastStage = -1, working = false, armT = 0;
  const robotM = new Map<number, THREE.Group>(), wreckM = new Map<number, THREE.Group>();
  if (home && home.robot) { home.robots = [...(home.robots ?? []), { ...home.robot, slot: home.robot.slot ?? 0 }]; delete home.robot; saveHome(home); }
  const piles: { m: THREE.Object3D; at: number }[] = []; // cada peça da pilha some quando a obra passa de "at"
  const stages: { m: THREE.Object3D; at: number }[] = []; let siteModel: THREE.Group | null = null, siteH = 0, sitePieces: { o: THREE.Object3D; y: number }[] = []; // cada peça da obra aparece quando a obra passa de "at"
  const wood = std(0x9a7448), woodD = std(0x6a4a2c), stoneM = std(0x8a8680), stoneD = std(0x6a6660), iron = std(0x4a4a50), ropeM = std(0xc9b07a), stake = std(0x7a5a3a);
  function buildSite(h: HomeSave) {
    if (site) ctx.scene.remove(site); siteSign = null; piles.length = 0; stages.length = 0; lastStage = -1;
    const g = new THREE.Group(), W = h.w * T, D = h.h * T, x0 = h.gx * T, z0 = h.gy * T, y0 = ctx.heightAt(x0 + W / 2, z0 + D / 2); g.position.set(x0, y0, z0); site = g;
    const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, ry = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
    // estacas e corda marcando o terreno
    for (const [x, z] of [[0, 0], [W, 0], [0, D], [W, D]]) add(new THREE.CylinderGeometry(0.06, 0.07, 0.9, 5), stake, x, 0.45, z);
    for (const [ax, az, bx, bz] of [[0, 0, W, 0], [W, 0, W, D], [W, D, 0, D], [0, D, 0, 0]]) { const L = Math.hypot(bx - ax, bz - az); add(new THREE.BoxGeometry(L, 0.02, 0.02), ropeM, (ax + bx) / 2, 0.8, (az + bz) / 2, -Math.atan2(bz - az, bx - ax)); }
    // as pilhas de material, na frente da obra (lado sul), cada uma some aos poucos
    const pz = D + 1.1; let k = 0;
    for (let i = 0; i < 12; i++) { const m = add(new THREE.BoxGeometry(1.9, 0.09, 0.26), i % 2 ? wood : woodD, 0.9 + (i % 3) * 0.02, 0.05 + Math.floor(i / 2) * 0.095, pz + (i % 2) * 0.28 - 0.14, (i % 2) * 0.05); piles.push({ m, at: 0.05 + (k++ / 40) }); } // tábuas
    for (let i = 0; i < 10; i++) { const m = add(new THREE.BoxGeometry(0.42, 0.22, 0.3), i % 3 ? stoneM : stoneD, W / 2 - 0.5 + (i % 3) * 0.45, 0.11 + Math.floor(i / 3) * 0.22, pz + (i % 2) * 0.1); piles.push({ m, at: 0.02 + i / 40 }); } // pedra do alicerce
    for (let i = 0; i < 3; i++) { const m = add(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 10), ropeM, W - 1.3 + i * 0.1, 0.08 + i * 0.16, pz - 0.2); piles.push({ m, at: 0.5 + i * 0.12 }); } // rolos de corda
    for (let i = 0; i < 4; i++) { const m = add(new THREE.BoxGeometry(0.3, 0.2, 0.2), iron, W - 0.4, 0.1 + i * 0.2, pz + 0.3); piles.push({ m, at: 0.25 + i * 0.16 }); } // caixas de pregos
    for (let i = 0; i < 8; i++) { const m = add(new THREE.CylinderGeometry(0.04, 0.05, 1.4, 4), stake, W + 0.6, 0.1 + (i % 4) * 0.09, pz - 0.5 + Math.floor(i / 4) * 0.12); m.rotation.x = Math.PI / 2; piles.push({ m, at: 0.3 + i * 0.08 }); } // galhos
    // a obra: alicerce (0–20%), esteios (20–40%), paredes (40–80%, sobem em camadas), telhado (80–100%)
    // (alicerce de 0 a 12%, depois a casa sobe)
    { const F: [number, number, number, number][] = [[W / 2, 0.2, W, 0.4], [W / 2, D - 0.2, W, 0.4], [0.2, D / 2, 0.4, D], [W - 0.2, D / 2, 0.4, D]]; F.forEach(([x, z, w, d], i) => stages.push({ m: add(new THREE.BoxGeometry(w, 0.4, d), i % 2 ? stoneD : stoneM, x, 0.2, z), at: i * 0.04 }));
      stages.push({ m: add(new THREE.BoxGeometry(W - 0.8, 0.12, D - 0.8), std(0x8a6a44), W / 2, 0.3, D / 2), at: 0.16 }); } // alicerce de pedra e o piso
    /* 28/10 (Erling: "conforme a casa fica pronta, 25% 50% 75%, ela vai crescendo, tomando forma"): depois do alicerce, a própria casa
       que vai ficar pronta sobe do chão — um corte horizontal que vai subindo com a obra (o modelo é o mesmo da casa acabada) */
    siteModel = null; siteH = 0; sitePieces = []; { const mdl = ctx.siteModel?.(h); if (mdl) { /* cada peça da casa aparece quando a obra chega à altura de onde ela começa: alicerce, paredes, janelas, telhado por último */
      mdl.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(mdl); siteH = Math.max(1, bb.max.y); const b1 = new THREE.Box3();
      mdl.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh && !(o as THREE.Sprite).isSprite) return; b1.setFromObject(o); sitePieces.push({ o, y: Math.max(0, b1.min.y) + Math.min(0.6, (b1.max.y - b1.min.y) * 0.25) }); o.castShadow = true; });
      g.add(mdl); siteModel = mdl; } }
    // andaime (some quando a obra termina)
    for (const x of [-0.5, W + 0.5]) for (const z of [-0.5, D + 0.5]) { const pole = add(new THREE.CylinderGeometry(0.05, 0.05, 3.6, 5), stake, x, 1.8, z); piles.push({ m: pole, at: 0.97 }); }
    for (const z of [-0.5, D + 0.5]) { const b = add(new THREE.BoxGeometry(W + 1, 0.08, 0.5), wood, W / 2, 1.9, z); piles.push({ m: b, at: 0.97 }); }
    /* o terreno não é plano: estacas e pilhas pousam no chão de onde estão (senão ficavam enterradas na encosta) */
    for (const c of g.children) { const isStage = stages.some((q) => q.m === c); if (isStage) continue; const gy = ctx.heightAt(x0 + c.position.x, z0 + c.position.z); c.position.y += gy - y0; }
    ctx.scene.add(g); refresh(); }
  function refresh() { if (!home || !site) return; drawSiteSign(); const p = home.done / home.work; for (const q of piles) q.m.visible = p < q.at; for (const q of stages) q.m.visible = p >= q.at;
    if (siteModel) { const k = Math.max(0, Math.min(1, (p - 0.12) / 0.88)), lv = k * siteH; for (const q of sitePieces) q.o.visible = q.y <= lv; }
    const st = p < 0.2 ? 0 : p < 0.4 ? 1 : p < 0.8 ? 2 : 3; if (st !== lastStage && lastStage >= 0) ctx.log(['🧱 O alicerce de pedra está assentado.', '🪵 Os esteios de pé: a casa já tem esqueleto.', '🔨 As paredes sobem, tábua por tábua.', '🏠 O telhado está subindo. Falta pouco.'][st], '#ffe08a'); lastStage = st; }
  function makeSign(h: HomeSave) {
    if (sign) ctx.scene.remove(sign); const g = new THREE.Group(); const x = (h.gx + h.w / 2 + 1.6) * T, z = (h.gy + h.h) * T + 1.2; g.position.set(x, ctx.heightAt(x, z), z); sign = g;
    const c = document.createElement('canvas'); c.width = 256; c.height = 96; const k = c.getContext('2d')!; k.fillStyle = '#7a5a34'; k.fillRect(0, 0, 256, 96); k.strokeStyle = '#3a2614'; k.lineWidth = 6; k.strokeRect(3, 3, 250, 90);
    k.fillStyle = '#fff0c8'; k.textAlign = 'center'; k.font = '600 20px Georgia'; k.fillText('Casa de', 128, 38); k.font = '700 28px Georgia'; k.fillText(h.owner.slice(0, 16), 128, 74);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.6, 6), std(0x4a3220)); post.position.y = 0.8; g.add(post);
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 0.06), [std(0x5a3a20), std(0x5a3a20), std(0x5a3a20), std(0x5a3a20), new THREE.MeshToonMaterial({ map: tex }), new THREE.MeshToonMaterial({ map: tex })]); board.position.y = 1.5; g.add(board);
    ctx.scene.add(g); }
  function finish() { if (!home) return; if (site) { ctx.scene.remove(site); site = null; } ctx.block(home.gx, home.gy, home.w, home.h, false); ctx.addHouse(home); if (home.signed) makeSign(home); if (!home.deedId) home.deedId = Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 10); if (!home.deed) { home.deed = Date.now(); saveHome(home); try { ctx.onDone?.(home); } catch { /* */ } }
    const cx = (home.gx + home.w / 2) * T, cz = (home.gy + home.h / 2) * T; for (let i = 0; i < 60; i++) ctx.particles.spawn(cx + (Math.random() - 0.5) * home.w * T, ctx.heightAt(cx, cz) + 3 + Math.random() * 2, cz + (Math.random() - 0.5) * home.h * T, { vx: (Math.random() - 0.5) * 2, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 2, life: 1.2, s0: 0.4, s1: 0.05, c0: 0xffffff, c1: 0xffd070, a: 0.9 }); }
  /* ---- os Ajudantes de Obra: robôs pedreiros com braço de martelo; indefesos. Um em cada canto do canteiro ---- */
  const live = () => (home?.robots ?? []).filter((r) => !r.dead && r.until > Date.now());
  const robotPos = (slot: number) => { if (!home) return { x: 0, z: 0 }; const x0 = home.gx * T - 0.9, x1 = (home.gx + home.w) * T + 0.9, z0 = home.gy * T - 0.9, z1 = (home.gy + home.h) * T + 0.9;
    return [{ x: x1, z: z1 }, { x: x0, z: z1 }, { x: x1, z: z0 }, { x: x0, z: z0 }][slot & 3]; };
  function clearRobotMeshes() { for (const g of robotM.values()) ctx.scene.remove(g); for (const g of wreckM.values()) ctx.scene.remove(g); robotM.clear(); wreckM.clear(); }
  function showRobots() { clearRobotMeshes(); if (!home || home.done >= home.work) return; const now = Date.now();
    for (const r of home.robots ?? []) { const p = robotPos(r.slot);
      if (r.dead) { const g = new THREE.Group(); g.position.set(p.x, ctx.heightAt(p.x, p.z), p.z);
        for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.14 + Math.random() * 0.2, 0.08 + Math.random() * 0.12, 0.14 + Math.random() * 0.2), std(i % 2 ? 0x8a6a3a : 0x3a3d44)); m.position.set((Math.random() - 0.5) * 0.9, 0.06, (Math.random() - 0.5) * 0.9); m.rotation.set(Math.random(), Math.random() * 3, Math.random()); g.add(m); }
        ctx.scene.add(g); wreckM.set(r.slot, g); continue; }
      if (r.until <= now) continue;
      const tier = r.tier, s0 = 1.35 + tier * 0.12, g = new THREE.Group(); g.position.set(p.x, ctx.heightAt(p.x, p.z), p.z);
      const c = { x: (home.gx + home.w / 2) * T, z: (home.gy + home.h / 2) * T }; g.rotation.y = Math.atan2(c.x - p.x, c.z - p.z); /* de frente para a obra */
      buildWorker(g, tier, s0 * 0.78);
      g.userData.slot = r.slot; g.userData.base = { x: p.x, z: p.z }; ctx.scene.add(g); robotM.set(r.slot, g); anim.set(r.slot, { ph: 'work', t: 2 + r.slot * 1.7, tx: p.x, tz: p.z }); } }
  /* 28/10 (Erling: "mais steampunk, sair faísca, uma mão serra, a outra martela, ir no monte de entulho pegar coisas e voltar"):
     o Ajudante é uma caldeira de cobre sobre pernas de pistão, com chaminé que fuma, elmo de escafandro de lente âmbar,
     o braço esquerdo é uma serra circular que gira e o direito, um martelo a vapor. Ele martela e serra no canto dele, vai até as
     pilhas de material, se abaixa, volta com uma tábua no ombro e recomeça. */
  function buildWorker(g: THREE.Group, tier: number, s: number) {
    const copper = std(tier === 2 ? 0xa0703a : tier === 1 ? 0x8a5228 : 0x7a4a24), brass = std(0x9a7430), iron = std(0x34363c), steel = std(0x9aa0a6), glowA = new THREE.MeshBasicMaterial({ color: 0xffb040, toneMapped: false });
    const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, par: THREE.Object3D = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; par.add(o); return o; };
    for (const [sx, nm] of [[-1, 'legL'], [1, 'legR']] as [number, string][]) { const hip = new THREE.Group(); hip.position.set(sx * 0.17 * s, 0.5 * s, 0); hip.name = nm; g.add(hip);
      add(new THREE.CylinderGeometry(0.07 * s, 0.07 * s, 0.24 * s, 8), copper, 0, -0.12 * s, 0, hip); add(new THREE.CylinderGeometry(0.04 * s, 0.04 * s, 0.26 * s, 6), steel, 0, -0.32 * s, 0, hip);
      add(new THREE.BoxGeometry(0.16 * s, 0.08 * s, 0.28 * s), iron, 0, -0.46 * s, 0.04 * s, hip); add(new THREE.SphereGeometry(0.06 * s, 8, 6), brass, 0, 0, 0, hip); }
    const torso = new THREE.Group(); torso.name = 'torso'; g.add(torso);
    add(new THREE.CylinderGeometry(0.26 * s, 0.28 * s, 0.46 * s, 14), copper, 0, 0.78 * s, 0, torso);
    for (const y of [0.6, 0.78, 0.96]) add(new THREE.TorusGeometry(0.275 * s, 0.02 * s, 5, 18), brass, 0, y * s, 0, torso).rotation.x = Math.PI / 2;
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; add(new THREE.SphereGeometry(0.016 * s, 4, 3), brass, Math.cos(a) * 0.282 * s, 0.69 * s, Math.sin(a) * 0.282 * s, torso); }
    add(new THREE.CircleGeometry(0.07 * s, 12), glowA, 0, 0.74 * s, 0.283 * s, torso); add(new THREE.TorusGeometry(0.075 * s, 0.015 * s, 5, 14), brass, 0, 0.74 * s, 0.284 * s, torso); // a fornalha acesa
    const chim = add(new THREE.CylinderGeometry(0.045 * s, 0.04 * s, 0.32 * s, 8), iron, -0.14 * s, 1.16 * s, -0.12 * s, torso); chim.name = 'chim'; add(new THREE.CylinderGeometry(0.07 * s, 0.045 * s, 0.06 * s, 8), iron, -0.14 * s, 1.34 * s, -0.12 * s, torso);
    const head = new THREE.Group(); head.position.set(0.04 * s, 1.14 * s, 0.03 * s); torso.add(head);
    add(new THREE.SphereGeometry(0.14 * s, 12, 9), brass, 0, 0, 0, head); add(new THREE.CylinderGeometry(0.07 * s, 0.07 * s, 0.05 * s, 12), iron, 0, 0, 0.12 * s, head).rotation.x = Math.PI / 2;
    add(new THREE.CircleGeometry(0.055 * s, 12), glowA, 0, 0, 0.146 * s, head);
    /* braço esquerdo: a serra circular */
    const armL = new THREE.Group(); armL.name = 'armL'; armL.position.set(-0.32 * s, 0.94 * s, 0.02 * s); torso.add(armL);
    for (let k = 0; k < 3; k++) add(new THREE.TorusGeometry(0.04 * s, 0.016 * s, 5, 8), copper, 0, -k * 0.065 * s, 0, armL).rotation.x = Math.PI / 2;
    add(new THREE.BoxGeometry(0.1 * s, 0.1 * s, 0.12 * s), iron, 0, -0.24 * s, 0.04 * s, armL);
    const saw = new THREE.Group(); saw.name = 'saw'; saw.position.set(0, -0.3 * s, 0.17 * s); armL.add(saw);
    add(new THREE.CylinderGeometry(0.15 * s, 0.15 * s, 0.012 * s, 16), steel, 0, 0, 0, saw).rotation.z = Math.PI / 2;
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; const t = add(new THREE.BoxGeometry(0.012 * s, 0.04 * s, 0.03 * s), steel, 0, Math.cos(a) * 0.16 * s, Math.sin(a) * 0.16 * s, saw); t.rotation.x = -a; }
    add(new THREE.CylinderGeometry(0.035 * s, 0.035 * s, 0.03 * s, 8), brass, 0, 0, 0, saw).rotation.z = Math.PI / 2;
    /* braço direito: o martelo a vapor */
    const armR = new THREE.Group(); armR.name = 'armR'; armR.position.set(0.32 * s, 0.94 * s, 0.02 * s); torso.add(armR);
    for (let k = 0; k < 3; k++) add(new THREE.TorusGeometry(0.04 * s, 0.016 * s, 5, 8), copper, 0, -k * 0.065 * s, 0, armR).rotation.x = Math.PI / 2;
    add(new THREE.CylinderGeometry(0.03 * s, 0.03 * s, 0.3 * s, 6), steel, 0, -0.32 * s, 0.06 * s, armR);
    const hh = add(new THREE.BoxGeometry(0.22 * s, 0.11 * s, 0.11 * s), iron, 0, -0.48 * s, 0.1 * s, armR); hh.name = 'hammerHead';
    add(new THREE.BoxGeometry(0.06 * s, 0.13 * s, 0.13 * s), brass, 0.12 * s, -0.48 * s, 0.1 * s, armR);
    /* a tábua que ele carrega no ombro (só aparece na volta das pilhas) */
    const carry = add(new THREE.BoxGeometry(1.2 * s, 0.07 * s, 0.22 * s), std(0x9a7448), 0, 1.42 * s, 0.02 * s, torso); carry.name = 'carry'; carry.visible = false; carry.rotation.y = 0.2;
  }
  /** o vai e vem de cada Ajudante: trabalha no canto, vai às pilhas, pega, volta carregando */
  const anim = new Map<number, { ph: 'work' | 'go' | 'pick' | 'back'; t: number; tx: number; tz: number }>();
  const sparks = (x: number, y: number, z: number, n: number, hot = true) => { for (let i = 0; i < n; i++) ctx.particles.spawn(x, y, z, { vx: (Math.random() - 0.5) * 3, vy: 0.8 + Math.random() * 2.4, vz: (Math.random() - 0.5) * 3, life: 0.35 + Math.random() * 0.3, s0: 0.1, s1: 0.02, c0: hot ? 0xfff0a0 : 0xd8c8a0, c1: hot ? 0xff7a20 : 0x8a7a60, a: 1 }); };
  function animRobots(dt: number, tt: number) { if (!home) return;
    const W = home.w * T, D = home.h * T, x0 = home.gx * T, z0 = home.gy * T, cx = x0 + W / 2, cz = z0 + D / 2;
    for (const [slot, g] of robotM) { const A = anim.get(slot); if (!A) continue; const base = g.userData.base as { x: number; z: number };
      const armL = g.getObjectByName('armL'), armR = g.getObjectByName('armR'), saw = g.getObjectByName('saw'), carry = g.getObjectByName('carry'), torso = g.getObjectByName('torso'), legL = g.getObjectByName('legL'), legR = g.getObjectByName('legR');
      const walkTo = (tx: number, tz: number) => { const dx = tx - g.position.x, dz = tz - g.position.z, L = Math.hypot(dx, dz), sp = Math.min(L, dt * 1.7); if (L > 0.02) { g.position.x += dx / L * sp; g.position.z += dz / L * sp; g.rotation.y = Math.atan2(dx, dz); }
        g.position.y = ctx.heightAt(g.position.x, g.position.z) + Math.abs(Math.sin(tt * 9)) * 0.03; const w = Math.sin(tt * 9) * 0.7; if (legL) legL.rotation.x = w; if (legR) legR.rotation.x = -w; if (armL) armL.rotation.x = -w * 0.4; if (armR) armR.rotation.x = w * 0.4; return L < 0.06; };
      A.t -= dt;
      if (A.ph === 'work') { g.rotation.y = Math.atan2(cx - g.position.x, cz - g.position.z); if (legL) legL.rotation.x = 0; if (legR) legR.rotation.x = 0; if (torso) torso.rotation.x = 0.12;
        const ph = tt * 5.2 + slot; if (armR) armR.rotation.x = -1.3 + Math.max(0, Math.sin(ph)) * 1.6; if (armL) armL.rotation.x = -0.9 + Math.sin(tt * 2.1 + slot) * 0.15; if (saw) saw.rotation.x += dt * 26;
        const near = Math.random() < 0.6; if (near && Math.sin(ph) > 0.96 && Math.sin(ph - dt * 5.2) <= 0.96) { const f = 0.55; sparks(g.position.x + Math.sin(g.rotation.y) * f + Math.cos(g.rotation.y) * 0.25, g.position.y + 0.32, g.position.z + Math.cos(g.rotation.y) * f - Math.sin(g.rotation.y) * 0.25, 7); ctx.hit?.(g.position.x, g.position.z); }
        if (Math.random() < dt * 9) sparks(g.position.x + Math.sin(g.rotation.y) * 0.5 - Math.cos(g.rotation.y) * 0.25, g.position.y + 0.55, g.position.z + Math.cos(g.rotation.y) * 0.5 + Math.sin(g.rotation.y) * 0.25, 1); // a serra soltando faísca
        if (A.t <= 0) { A.ph = 'go'; A.tx = x0 + W * (0.25 + Math.random() * 0.5); A.tz = z0 + D + 1.9; if (torso) torso.rotation.x = 0; } }
      else if (A.ph === 'go') { if (saw) saw.rotation.x += dt * 4; if (walkTo(A.tx, A.tz)) { A.ph = 'pick'; A.t = 1.1; } }
      else if (A.ph === 'pick') { const k = Math.sin(Math.min(1, 1 - A.t / 1.1) * Math.PI); if (torso) torso.rotation.x = k * 0.55; if (armL) armL.rotation.x = -k * 1.1; if (armR) armR.rotation.x = -k * 1.1; if (A.t < 0.55 && carry && !carry.visible) { carry.visible = true; sparks(g.position.x, g.position.y + 0.2, g.position.z, 5, false); } if (A.t <= 0) { A.ph = 'back'; if (torso) torso.rotation.x = 0; } }
      else if (A.ph === 'back') { if (armR) armR.rotation.x = -2.6; if (walkTo(base.x, base.z)) { A.ph = 'work'; A.t = 6 + Math.random() * 4; if (carry) carry.visible = false; } }
      const chim = g.getObjectByName('chim'); if (chim && Math.random() < dt * 2.5) { const v = new THREE.Vector3(); chim.getWorldPosition(v); ctx.particles.spawn(v.x, v.y + 0.2, v.z, { vx: (Math.random() - 0.5) * 0.3, vy: 0.9, vz: (Math.random() - 0.5) * 0.3, life: 1.2, s0: 0.12, s1: 0.45, c0: 0xe8e4dc, c1: 0x8a8680, a: 0.45 }); } } }
  /* ---- a placa da obra: o que está sendo feito e quanto falta ---- */
  let siteSign: { g: THREE.Group; c: HTMLCanvasElement; tex: THREE.CanvasTexture; key: string } | null = null;
  function drawSiteSign() { if (!home || !site || home.done >= home.work) return;
    if (!siteSign) { const c = document.createElement('canvas'); c.width = 512; c.height = 320; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; const g = new THREE.Group();
      const W = home.w * T, D = home.h * T; g.position.set(-0.9, 0, D + 1.4); g.rotation.y = 0.35; const gy = ctx.heightAt(home.gx * T - 0.9, home.gy * T + D + 1.4) - site.position.y; g.position.y = gy;
      for (const x of [-0.62, 0.62]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.9, 6), std(0x5a3a20)); p.position.set(x, 0.95, 0); p.castShadow = true; g.add(p); }
      const face = new THREE.MeshToonMaterial({ map: tex }), wd = std(0x6a4a2c); const b = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.06), [wd, wd, wd, wd, face, wd]); b.position.y = 1.5; b.castShadow = true; g.add(b); void W;
      site.add(g); siteSign = { g, c, tex, key: '' }; }
    const n = live().length, left = home.work - home.done, key = `${home.done.toFixed(1)}|${n}|${home.contract ? 1 : 0}`; if (key === siteSign.key) return; siteSign.key = key;
    const k = siteSign.c.getContext('2d')!, Wc = 512, Hc = 320; k.fillStyle = '#e9d6a8'; k.fillRect(0, 0, Wc, Hc); for (let i = 0; i < 9; i++) { k.fillStyle = i % 2 ? 'rgba(120,80,30,.06)' : 'rgba(255,255,255,.06)'; k.fillRect(0, i * 36, Wc, 18); }
    k.strokeStyle = '#5a3a1a'; k.lineWidth = 10; k.strokeRect(5, 5, Wc - 10, Hc - 10); k.fillStyle = '#8a1d24'; k.fillRect(5, 5, Wc - 10, 58);
    k.fillStyle = '#ffe9b0'; k.textAlign = 'center'; k.font = '700 34px Georgia'; k.fillText('⚒ OBRA EM ANDAMENTO ⚒', Wc / 2, 46);
    k.fillStyle = '#2c1d10'; k.font = '700 34px Georgia'; k.fillText(home.name.slice(0, 26), Wc / 2, 108); k.font = 'italic 24px Georgia'; k.fillText(`do mestre ${home.owner.slice(0, 18)}`, Wc / 2, 140);
    const bx = 40, by = 162, bw = Wc - 80, p = home.done / home.work; k.fillStyle = '#6a4a2c'; k.fillRect(bx, by, bw, 26); k.fillStyle = '#d9a24f'; k.fillRect(bx + 3, by + 3, (bw - 6) * p, 20); k.fillStyle = '#2c1d10'; k.font = '700 18px Georgia'; k.fillText(`${Math.round(p * 100)}%`, Wc / 2, by + 20);
    k.font = '600 26px Georgia'; k.fillText(`${home.done.toFixed(1).replace('.', ',')} de ${home.work} turnos`, Wc / 2, 222);
    const days = left / 6; k.font = '24px Georgia'; k.fillText(`faltam ${left.toFixed(1).replace('.', ',')} turnos (${days < 1 ? 'menos de 1 dia' : `~${Math.ceil(days)} dia${Math.ceil(days) > 1 ? 's' : ''}`})`, Wc / 2, 256);
    k.font = 'italic 21px Georgia'; k.fillStyle = n ? '#3a5a1a' : '#6a4a2c'; k.fillText(n ? `${n} Ajudante${n > 1 ? 's' : ''} de Obra trabalhando · obra ${n + 1}× mais rápida` : home.contract ? 'Contrato da Companhia: os Ajudantes podem trabalhar aqui' : 'sem Contrato da Companhia (robôs não entram)', Wc / 2, 292);
    siteSign.tex.needsUpdate = true; }
  /** este ponto está coberto por uma Sentinela neste instante? */
  const coveredAt = (x: number, z: number, t: number) => ctx.sentries().some((q) => q.until >= t && Math.hypot(q.x - x, q.z - z) <= q.r);
  const coveredR = (r: Robot, t: number) => { const p = robotPos(r.slot); return coveredAt(p.x, p.z, t); };
  const covered = (t: number) => { const L = live(); if (!L.length) { const c = home ? { x: (home.gx + home.w / 2) * T, z: (home.gy + home.h / 2) * T } : { x: 0, z: 0 }; return coveredAt(c.x, c.z, t); } return L.every((r) => coveredR(r, t)); };
  function killRobot(r: Robot, at: number, why: string) { r.dead = at; if (home) saveHome(home); const m = robotM.get(r.slot); if (m) { const p = m.position; for (let i = 0; i < 30; i++) ctx.particles.spawn(p.x, p.y + 0.8, p.z, { vx: (Math.random() - 0.5) * 4, vy: Math.random() * 4, vz: (Math.random() - 0.5) * 4, life: 0.9, s0: 0.25, s1: 0.04, c0: 0xffd070, c1: 0x5a5a5a, a: 0.9 }); }
    showRobots(); ctx.log(why, '#ff9a6a'); }
  /** credita o trabalho de cada robô até agora (também o tempo com o jogo fechado), rolando os ataques turno a turno quando ninguém estava por perto */
  function creditRobot(now: number, offline: boolean): { turns: number; died: boolean } {
    if (!home || home.done >= home.work) return { turns: 0, died: false }; const before = home.done; let died = false, changed = false;
    for (const r of home.robots ?? []) { if (r.dead) continue; const end = Math.min(now, r.until); if (end <= r.last) continue; let t = r.last, gone = false;
      if (offline) { /* um turno de cada vez: 30% de chance de um bicho passar; sem torre cobrindo ESTE robô naquele instante, ele vira sucata */
        let k = Math.floor(t / TURN_MS) + 1; while (k * TURN_MS < end) { const at = k * TURN_MS, roll = (Math.sin(k * 12.9898 + home.gx * 78.233 + home.gy * 37.719 + r.slot * 5.17) * 43758.5453) % 1; if (Math.abs(roll) < 0.3 && !coveredR(r, at)) { home.done = Math.min(home.work, home.done + (at - t) / TURN_MS); r.last = at; killRobot(r, at, '🦾 Um bicho passou pela obra enquanto você estava longe e destruiu um Ajudante de Obra. Sem uma Sentinela cobrindo o canto dele, ele não tem como se defender.'); died = gone = true; break; } k++; } }
      if (!gone) { home.done = Math.min(home.work, home.done + (end - t) / TURN_MS); r.last = end; } changed = true; }
    const done = (home.robots ?? []).filter((r) => !r.dead && r.until <= now); if (done.length) { ctx.log(`🦾 ${done.length > 1 ? `${done.length} Ajudantes de Obra cumpriram` : 'O Ajudante de Obra cumpriu'} o contrato e ${done.length > 1 ? 'voltam' : 'volta'} para a Companhia.`, '#c8b890'); home.robots = (home.robots ?? []).filter((r) => !done.includes(r)); changed = true; showRobots(); }
    if (changed) { saveHome(home); refresh(); }
    if (home.done >= home.work) { ctx.log(`🏡 ${home.name} está pronta! Pendure a placa na frente (E) e entre: a cama cura, e a caixa de correio guarda os seus itens.`, '#ffe08a'); finish(); }
    return { turns: home.done - before, died }; }
  // abrir o jogo: recoloca o canteiro ou a casa, e acerta o que o robô fez enquanto o jogo estava fechado
  if (home && (home as HomeSave & { work: number }).work === 60) { home.work = 30; home.done = Math.min(home.done / 2, 29.9); saveHome(home); } // obras do teste de 28/10 (marteladas) viram turnos
  if (home) { if (home.done >= home.work) { ctx.addHouse(home); if (home.signed) makeSign(home); } else { ctx.block(home.gx, home.gy, home.w, home.h, true); buildSite(home); showRobots();
      const r0 = creditRobot(Date.now(), true); if (r0.turns > 0.05) ctx.log(`🦾 Enquanto você esteve fora, o Ajudante de Obra trabalhou ${r0.turns.toFixed(1).replace('.', ',')} turno(s). A obra está em ${home.done.toFixed(1).replace('.', ',')} de ${home.work} turnos.`, '#ffe08a'); } }
  const fmtT = (x: number) => x.toFixed(1).replace('.', ',');
  return {
    get home() { return home; },
    get working() { return working; },
    busy: () => !!home,
    start(w: Whole, gx: number, gy: number) { if (![gx, gy].every(Number.isFinite)) return; home = { id: w.id, name: w.name, gx, gy, w: w.w, h: w.h, work: w.work, done: 0, signed: false, owner: ctx.heroName() }; saveHome(home); ctx.block(gx, gy, w.w, w.h, true); buildSite(home); if (ctx.hasContract?.() && ctx.takeContract?.()) { home.contract = true; saveHome(home); ctx.log('📜 O Contrato de Obra Automatizada que estava na mochila foi vinculado a esta obra: já dá para chamar os Ajudantes.', '#ffe08a'); }
      ctx.log(`🏗 O canteiro de ${w.name} está marcado e o material descarregado. A obra pede ${w.work} turnos de trabalho (${w.work / 6} dias de Karmika): trabalhe nela (E) entre uma aventura e outra, ou contrate um Ajudante de Obra na Caravana de Latão — e proteja-o com Sentinelas.`, '#ffe08a'); },
    /** liga/desliga o trabalho do herói na obra */
    toggleWork() { if (!home || home.done >= home.work) return; working = !working; ctx.log(working ? `🔨 Você arregaça as mangas: cada minuto aqui é obra subindo (${fmtT(home.done)} de ${home.work} turnos). Saia de perto ou aperte E para parar.` : `🔨 Você larga as ferramentas. A obra está em ${fmtT(home.done)} de ${home.work} turnos.`, '#ffe08a'); },
    /** planta o Ajudante de Obra no canteiro (tier 0..2 = Mk I, II, III: 1, 2 ou 4 turnos) */
    deployRobot(tier: number, leftMs?: number): boolean { if (!home || home.done >= home.work) { ctx.log('🦾 O Ajudante de Obra só trabalha num canteiro de obra inteira — compre o projeto no B → Obras inteiras e marque o lugar.', '#ff9a8a'); return false; }
      if (!home.contract) { ctx.log('🦾 A Companhia só manda Ajudantes para obras com o Contrato de Obra Automatizada (a licença dos robôs). Compre um na Caravana de Latão e use: ele se vincula a esta obra.', '#ff9a8a'); return false; }
      const L = live(); if (L.length >= MAX_ROBOTS) { ctx.log(`🦾 A obra já tem ${MAX_ROBOTS} Ajudantes trabalhando — é o máximo.`, '#ff9a8a'); return false; }
      const used = new Set((home.robots ?? []).filter((r) => !r.dead && r.until > Date.now()).map((r) => r.slot)); let slot = 0; while (used.has(slot)) slot++;
      home.robots = (home.robots ?? []).filter((r) => r.slot !== slot); /* a sucata daquele canto sai: o novo robô recolhe */
      const now = Date.now(), dur = leftMs && leftMs > 0 ? leftMs : [1, 2, 4][tier] * TURN_MS; const r: Robot = { tier, until: now + dur, last: now, hp: 100, slot }; home.robots.push(r); saveHome(home); showRobots();
      const p = robotPos(slot); for (let i = 0; i < 24; i++) ctx.particles.spawn(p.x, ctx.heightAt(p.x, p.z) + 0.6, p.z, { vx: (Math.random() - 0.5) * 3, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 3, life: 0.8, s0: 0.3, s1: 0.05, c0: 0xffe08a, c1: 0xc8963a, a: 0.9 });
      const n = L.length + 1, mins = Math.round(dur / 60000);
      ctx.log(`🦾 O Ajudante de Obra Mk ${['I', 'II', 'III'][tier]} foi até o canteiro de ${home.name} e pegou o martelo: ${mins} min de trabalho sozinho. Agora são ${n} na obra (a obra anda ${n}× mais rápido com eles). ${coveredR(r, now) ? 'Uma Sentinela cobre o canto dele.' : '⚠ Nenhuma Sentinela cobre o canto dele: um bicho que passar acaba com ele.'}`, coveredR(r, now) ? '#ffe08a' : '#ffb070'); return true; },
    /** usar o Contrato: vincula à obra em curso; sem obra, fica guardado e se vincula sozinho à próxima */
    bindContract(): boolean { if (!home || home.done >= home.work) { ctx.log('📜 Guarde o contrato: ele se vincula sozinho à primeira obra inteira que você começar (B → Obras inteiras).', '#ffe08a'); return false; }
      if (home.contract) { ctx.log('📜 Esta obra já tem o Contrato da Companhia. Um por casa.', '#ff9a8a'); return false; }
      if (!ctx.takeContract?.()) return false; home.contract = true; saveHome(home); ctx.log(`📜 Contrato vinculado a ${home.name}: os Ajudantes de Obra já podem trabalhar nela (até ${MAX_ROBOTS}). Ele some quando a casa ficar pronta.`, '#ffe08a'); return false; /* já tirou da mochila aqui */ },
    /** o robô (ou a sucata) mais perto deste ponto, até 3,2 m */
    robotAt(x: number, z: number) { if (!home || home.done >= home.work) return null; let best: { slot: number; x: number; z: number; tier: number; left: number; dead: boolean } | null = null, bd = 3.2;
      for (const r of home.robots ?? []) { if (!r.dead && r.until <= Date.now()) continue; const p = robotPos(r.slot), d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; best = { slot: r.slot, x: p.x, z: p.z, tier: r.tier, left: Math.max(0, r.until - Date.now()), dead: !!r.dead }; } } return best; },
    /** desmonta o robô (guarda o tempo que sobrou) ou recolhe a sucata; devolve o item e o tempo para a mochila */
    packRobot(slot: number): { id: string; left: number } | null { if (!home) return null; const r = (home.robots ?? []).find((q) => q.slot === slot); if (!r) return null;
      creditRobot(Date.now(), false); if (!home) return null; home.robots = (home.robots ?? []).filter((q) => q !== r); saveHome(home); showRobots();
      if (r.dead) { ctx.log('🦾 Você recolhe a sucata do Ajudante. Não tem conserto.', '#c8b890'); return null; }
      const left = Math.max(0, r.until - Date.now()); if (left < 60000) { ctx.log('🦾 O Ajudante já tinha cumprido o contrato.', '#c8b890'); return null; }
      return { id: ['ajudante_obra', 'ajudante_obra_2', 'ajudante_obra_3'][r.tier], left }; },
    /** desistir: o canteiro se desmancha e o material se perde (pede confirmação antes, no menu) */
    quit() { if (!home || home.done >= home.work) return false; if (site) { ctx.scene.remove(site); site = null; } clearRobotMeshes();
      ctx.block(home.gx, home.gy, home.w, home.h, false); const n = home.name; home = null; working = false; lastStage = -1; saveHome(null); ctx.log(`🪓 Você desistiu de ${n}. O canteiro se desfaz e o material se perde.`, '#d0a080'); return true; },
    /** o DE-PARA com o servidor (28/10): o servidor guarda a casa de cada personagem. Chegou a do servidor:
     *  - sem casa aqui → a casa volta (save perdido, outra máquina);
     *  - mesma casa, mesmo lugar → fica o andamento maior;
     *  - lugar diferente → vale o servidor (o chão é dele); aparece no lugar certo ao reabrir. */
    fromServer(h: HomeSave | null): 'up' | 'restored' | 'merged' | 'moved' | 'same' { if (!h) return home ? 'up' : 'same';
      const ok = [h.gx, h.gy, h.w, h.h, h.work, h.done].every((v) => Number.isFinite(v)); if (!ok) return home ? 'up' : 'same';
      if (!home) { home = { ...h }; saveHome(home); if (home.done >= home.work) { ctx.addHouse(home); if (home.signed) makeSign(home); } else { ctx.block(home.gx, home.gy, home.w, home.h, true); buildSite(home); showRobots(); }
        ctx.log(`🏡 ${home.name} voltou do servidor: ${home.done >= home.work ? 'a casa está de pé' : `a obra está em ${fmtT(home.done)} de ${home.work} turnos`}.`, '#ffe08a'); return 'restored'; }
      if (home.gx === h.gx && home.gy === h.gy) { let ch = false; if (h.done > home.done + 0.01) { home.done = Math.min(home.work, h.done); ch = true; } if (h.signed && !home.signed) { home.signed = true; ch = true; } if (h.contract && !home.contract) { home.contract = true; ch = true; } if (Array.isArray(h.decor) && h.decor.length && !home.decor?.length) { home.decor = h.decor; ch = true; }
        if (ch) { saveHome(home); refresh(); if (home.done >= home.work) finish(); } return ch ? 'merged' : 'same'; }
      try { localStorage.setItem(KEY, JSON.stringify(h)); } catch { /* */ } ctx.log(`🏡 O servidor guarda a sua casa em outro lugar (${h.name}). Ela aparece no lugar certo quando você reabrir o jogo.`, '#ffe08a'); return 'moved'; },
    /** a casa foi vendida (o comprador assinou a escritura): sai do seu mundo e do seu save */
    release(why: string) { if (!home) return; const h = home; if (h.done >= h.work) ctx.removeHouse?.(h); else { if (site) { ctx.scene.remove(site); site = null; } clearRobotMeshes(); ctx.block(h.gx, h.gy, h.w, h.h, false); }
      if (sign) { ctx.scene.remove(sign); sign = null; } home = null; working = false; lastStage = -1; try { localStorage.removeItem(KEY); } catch { /* */ } ctx.log(why, '#ffe08a'); },
    /** teste: adianta a obra (fração do total) */
    advance(frac: number) { if (!home || home.done >= home.work) return false; home.done = Math.min(home.work, home.done + home.work * frac); saveHome(home); refresh(); if (home.done >= home.work) finish(); return true; },
    /** mobília/decoração da casa (salva junto e vai para o servidor) */
    get decor() { return home?.decor ?? []; },
    setDecor(list: NonNullable<HomeSave['decor']>) { if (!home) return; home.decor = list.slice(0, 160); saveHome(home); },
    door() { if (!home) return null; const d = houseDoor(ctx.variantOf?.(home) ?? 2, home.w * T, home.h * T); return { x: home.gx * T + d.x, z: home.gy * T + d.z + 0.9 }; }, /* 28/10: a casa do jogador é a casa em L da vila (variante 2), com a porta virada para a câmera */
    siteCenter() { return home && home.done < home.work ? { x: (home.gx + home.w / 2) * T, z: (home.gy + home.h) * T + 0.6, p: home.done / home.work, done: home.done, need: home.work, robot: live().length > 0, robots: live().length, covered: covered(Date.now()) } : null; },
    signAt() { return home && home.done >= home.work ? { x: (home.gx + home.w / 2 + 1.6) * T, z: (home.gy + home.h) * T + 1.2 } : null; },
    sign() { if (!home || home.done < home.work) return; home.signed = true; home.owner = ctx.heroName(); saveHome(home); makeSign(home); ctx.log(`🪧 A placa está na frente: “Casa de ${home.owner}”.`, '#ffe08a'); },
    update(dt: number, heroX: number, heroZ: number, moving: boolean, hammer: () => void) {
      if (!home || home.done >= home.work) { working = false; return; }
      const c = { x: (home.gx + home.w / 2) * T, z: (home.gy + home.h / 2) * T }, near = Math.hypot(heroX - c.x, heroZ - c.z) < Math.max(home.w, home.h) * T * 0.5 + 6;
      if (working && (!near || moving)) { working = false; ctx.log(`🔨 Você ${moving ? 'saiu andando' : 'se afastou da obra'} e parou de trabalhar (${fmtT(home.done)} de ${home.work} turnos). E perto da obra para voltar.`, '#c8b890'); } /* 28/10 (Erling): andou, parou — igual a cortar árvore */
      if (working && !moving) { home.done = Math.min(home.work, home.done + dt * 1000 / TURN_MS); armT -= dt; if (armT <= 0) { armT = 1.3; hammer(); } if (Math.random() < dt * 0.5) saveHome(home); refresh(); if (home.done >= home.work) { working = false; saveHome(home); ctx.log(`🏡 ${home.name} está pronta! Pendure a placa na frente (E) e entre.`, '#ffe08a'); finish(); return; } }
      // o robô: braço martelando; com o herói por perto, bicho de verdade perto dele e sem torre cobrindo = sucata
      if (ctx.heroNear((home.gx + home.w / 2) * T, (home.gy + home.h / 2) * T, 60)) { animRobots(Math.min(dt, 0.1), performance.now() / 1000); drawSiteSign(); }
      { const nw = performance.now(); if (nw - robotT < 1000) return; robotT = nw; } /* relógio de verdade (o dt do quadro é limitado e atrasaria a conta) */
      const L = live(); if (!L.length) return; const now = Date.now(); let anyNear = false;
      for (const r of L) { const p = robotPos(r.slot); if (!ctx.heroNear(p.x, p.z, 70)) continue; anyNear = true;
        if (ctx.enemyNear(p.x, p.z, 6) && !coveredR(r, now)) { r.hp -= 25; if (r.hp <= 0) killRobot(r, now, '🦾 Os bichos acabaram com um Ajudante de Obra! Ele não se defende sozinho: plante Sentinelas perto de cada canto do canteiro.'); else ctx.log('🦾 Um Ajudante de Obra está sendo atacado!', '#ff9a6a'); saveHome(home); } }
      creditRobot(now, !anyNear);
    },
  };
}
