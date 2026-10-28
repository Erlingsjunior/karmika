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
  robot?: { tier: number; until: number; last: number; hp: number; dead?: number } }
/** 1 turno de Karmika = 30 min reais; 6 turnos = 1 dia */
export const TURN_MS = 30 * 60 * 1000;
const KEY = 'karmika.home.v1';
export const loadHome = (): HomeSave | null => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
const saveHome = (h: HomeSave | null) => { try { if (h) localStorage.setItem(KEY, JSON.stringify(h)); else localStorage.removeItem(KEY); } catch { /* */ } };

export function createObras(ctx: {
  scene: THREE.Scene; T: number; heightAt(x: number, z: number): number; log(t: string, c?: string): void;
  /** marca/desmarca a pegada como parede (colisão) */ block(gx: number, gy: number, w: number, h: number, on: boolean): void;
  /** a casa pronta entra no mundo como prop (e sai, se for demolida) */ addHouse(h: HomeSave): void;
  heroName(): string; particles: { spawn(x: number, y: number, z: number, o: Record<string, number>): void };
  /** Sentinelas de pé (x, z em metros; r = alcance; until = até quando) */ sentries(): { x: number; z: number; r: number; until: number }[];
  /** um bicho vivo perto deste ponto? (só existe quando o herói está por perto) */ enemyNear(x: number, z: number, r: number): boolean;
  /** o herói está perto (os bichos da região estão simulados)? */ heroNear(x: number, z: number, r: number): boolean;
}) {
  const T = ctx.T; let home = loadHome(); let site: THREE.Group | null = null, sign: THREE.Group | null = null, robotT = 1, lastStage = -1, working = false, robotM: THREE.Group | null = null, wreck: THREE.Group | null = null, armT = 0;
  const piles: { m: THREE.Object3D; at: number }[] = []; // cada peça da pilha some quando a obra passa de "at"
  const stages: { m: THREE.Object3D; at: number }[] = []; // cada peça da obra aparece quando a obra passa de "at"
  const wood = std(0x9a7448), woodD = std(0x6a4a2c), stoneM = std(0x8a8680), stoneD = std(0x6a6660), roofM = std(0x8a3a28), iron = std(0x4a4a50), ropeM = std(0xc9b07a), stake = std(0x7a5a3a);
  function buildSite(h: HomeSave) {
    if (site) ctx.scene.remove(site); piles.length = 0; stages.length = 0; lastStage = -1;
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
    const H = 3.0, nl = 8;
    { const F: [number, number, number, number][] = [[W / 2, 0.2, W, 0.4], [W / 2, D - 0.2, W, 0.4], [0.2, D / 2, 0.4, D], [W - 0.2, D / 2, 0.4, D]]; F.forEach(([x, z, w, d], i) => stages.push({ m: add(new THREE.BoxGeometry(w, 0.4, d), i % 2 ? stoneD : stoneM, x, 0.2, z), at: i * 0.04 }));
      stages.push({ m: add(new THREE.BoxGeometry(W - 0.8, 0.12, D - 0.8), std(0x8a6a44), W / 2, 0.3, D / 2), at: 0.16 }); } // alicerce de pedra e o piso
    for (const [x, z] of [[0.25, 0.25], [W - 0.25, 0.25], [0.25, D - 0.25], [W - 0.25, D - 0.25], [W / 2, 0.25], [W / 2, D - 0.25]]) stages.push({ m: add(new THREE.BoxGeometry(0.22, H, 0.22), woodD, x, 0.35 + H / 2, z), at: 0.2 + stages.length * 0.02 });
    for (let l = 0; l < nl; l++) { const y = 0.35 + (l + 0.5) * H / nl, at = 0.4 + l / nl * 0.4;
      for (const [x, z, w, d] of [[W / 2, 0.2, W - 0.4, 0.14], [0.2, D / 2, 0.14, D - 0.4], [W - 0.2, D / 2, 0.14, D - 0.4]] as [number, number, number, number][]) stages.push({ m: add(new THREE.BoxGeometry(w, H / nl - 0.02, d), l % 2 ? wood : woodD, x, y, z), at });
      for (const sx of [-1, 1]) stages.push({ m: add(new THREE.BoxGeometry(W / 2 - 0.9, H / nl - 0.02, 0.14), l % 2 ? wood : woodD, W / 2 + sx * (W / 4 + 0.35), y, D - 0.2), at }); } // frente com o vão da porta
    for (let i = 0; i < 6; i++) { const t = i / 6; for (const s of [-1, 1]) { const r = add(new THREE.BoxGeometry(W + 0.6, 0.1, D / 2 + 0.5), roofM, W / 2, 0.35 + H + 0.65 - 0.01 * i, D / 2 + s * D / 4); r.rotation.x = s * 0.5; r.scale.set(1, 1, 0.2 + t * 0.85); stages.push({ m: r, at: 0.8 + t * 0.2 }); } }
    // andaime (some quando a obra termina)
    for (const x of [-0.5, W + 0.5]) for (const z of [-0.5, D + 0.5]) { const pole = add(new THREE.CylinderGeometry(0.05, 0.05, 3.6, 5), stake, x, 1.8, z); piles.push({ m: pole, at: 0.97 }); }
    for (const z of [-0.5, D + 0.5]) { const b = add(new THREE.BoxGeometry(W + 1, 0.08, 0.5), wood, W / 2, 1.9, z); piles.push({ m: b, at: 0.97 }); }
    /* o terreno não é plano: estacas e pilhas pousam no chão de onde estão (senão ficavam enterradas na encosta) */
    for (const c of g.children) { const isStage = stages.some((q) => q.m === c); if (isStage) continue; const gy = ctx.heightAt(x0 + c.position.x, z0 + c.position.z); c.position.y += gy - y0; }
    ctx.scene.add(g); refresh(); }
  function refresh() { if (!home || !site) return; const p = home.done / home.work; for (const q of piles) q.m.visible = p < q.at; for (const q of stages) q.m.visible = p >= q.at;
    const st = p < 0.2 ? 0 : p < 0.4 ? 1 : p < 0.8 ? 2 : 3; if (st !== lastStage && lastStage >= 0) ctx.log(['🧱 O alicerce de pedra está assentado.', '🪵 Os esteios de pé: a casa já tem esqueleto.', '🔨 As paredes sobem, tábua por tábua.', '🏠 O telhado está subindo. Falta pouco.'][st], '#ffe08a'); lastStage = st; }
  function makeSign(h: HomeSave) {
    if (sign) ctx.scene.remove(sign); const g = new THREE.Group(); const x = (h.gx + h.w / 2 + 1.6) * T, z = (h.gy + h.h) * T + 1.2; g.position.set(x, ctx.heightAt(x, z), z); sign = g;
    const c = document.createElement('canvas'); c.width = 256; c.height = 96; const k = c.getContext('2d')!; k.fillStyle = '#7a5a34'; k.fillRect(0, 0, 256, 96); k.strokeStyle = '#3a2614'; k.lineWidth = 6; k.strokeRect(3, 3, 250, 90);
    k.fillStyle = '#fff0c8'; k.textAlign = 'center'; k.font = '600 20px Georgia'; k.fillText('Casa de', 128, 38); k.font = '700 28px Georgia'; k.fillText(h.owner.slice(0, 16), 128, 74);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.6, 6), std(0x4a3220)); post.position.y = 0.8; g.add(post);
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 0.06), [std(0x5a3a20), std(0x5a3a20), std(0x5a3a20), std(0x5a3a20), new THREE.MeshToonMaterial({ map: tex }), new THREE.MeshToonMaterial({ map: tex })]); board.position.y = 1.5; g.add(board);
    ctx.scene.add(g); }
  function finish() { if (!home) return; if (site) { ctx.scene.remove(site); site = null; } ctx.block(home.gx, home.gy, home.w, home.h, false); ctx.addHouse(home); if (home.signed) makeSign(home);
    const cx = (home.gx + home.w / 2) * T, cz = (home.gy + home.h / 2) * T; for (let i = 0; i < 60; i++) ctx.particles.spawn(cx + (Math.random() - 0.5) * home.w * T, ctx.heightAt(cx, cz) + 3 + Math.random() * 2, cz + (Math.random() - 0.5) * home.h * T, { vx: (Math.random() - 0.5) * 2, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 2, life: 1.2, s0: 0.4, s1: 0.05, c0: 0xffffff, c1: 0xffd070, a: 0.9 }); }
  /* ---- o Ajudante de Obra: robô pedreiro com braço de martelo; indefeso ---- */
  const robotPos = () => home ? { x: (home.gx + home.w) * T + 0.9, z: (home.gy + home.h) * T + 0.4 } : { x: 0, z: 0 };
  function showRobot() { if (robotM) { ctx.scene.remove(robotM); robotM = null; } if (!home?.robot || home.robot.dead || home.done >= home.work) return; const tier = home.robot.tier, s0 = 1 + tier * 0.12;
    const g = new THREE.Group(), p = robotPos(); g.position.set(p.x, ctx.heightAt(p.x, p.z), p.z); g.rotation.y = -Math.PI * 0.75;
    const body = std(tier === 2 ? 0xd8c070 : tier === 1 ? 0xb87333 : 0xc8963a), dark = std(0x3a3d44), glowE = new THREE.MeshBasicMaterial({ color: 0xffd070, toneMapped: false });
    const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, par: THREE.Object3D = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; par.add(o); return o; };
    for (const sx of [-1, 1]) { add(new THREE.CylinderGeometry(0.06 * s0, 0.07 * s0, 0.5 * s0, 6), dark, sx * 0.18 * s0, 0.25 * s0, 0); add(new THREE.BoxGeometry(0.16 * s0, 0.06 * s0, 0.26 * s0), body, sx * 0.18 * s0, 0.03, 0.04); }
    add(new THREE.BoxGeometry(0.5 * s0, 0.45 * s0, 0.36 * s0), body, 0, 0.72 * s0, 0); add(new THREE.CylinderGeometry(0.06 * s0, 0.06 * s0, 0.3 * s0, 6), dark, 0, 1.05 * s0, -0.12 * s0); // a chaminé
    add(new THREE.BoxGeometry(0.3 * s0, 0.22 * s0, 0.26 * s0), dark, 0, 1.06 * s0, 0.04); add(new THREE.BoxGeometry(0.2 * s0, 0.05 * s0, 0.02), glowE, 0, 1.08 * s0, 0.18 * s0);
    const arm = new THREE.Group(); arm.position.set(0.3 * s0, 0.85 * s0, 0); g.add(arm); arm.name = 'arm';
    add(new THREE.BoxGeometry(0.08 * s0, 0.45 * s0, 0.08 * s0), dark, 0, -0.2 * s0, 0.1, arm); add(new THREE.BoxGeometry(0.22 * s0, 0.12 * s0, 0.12 * s0), std(0x6a6a70), 0, -0.45 * s0, 0.18 * s0, arm);
    ctx.scene.add(g); robotM = g; }
  function showWreck() { if (wreck) { ctx.scene.remove(wreck); wreck = null; } if (!home?.robot?.dead || home.done >= home.work) return; const g = new THREE.Group(), p = robotPos(); g.position.set(p.x, ctx.heightAt(p.x, p.z), p.z);
    for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.14 + Math.random() * 0.2, 0.08 + Math.random() * 0.12, 0.14 + Math.random() * 0.2), std(i % 2 ? 0x8a6a3a : 0x3a3d44)); m.position.set((Math.random() - 0.5) * 0.9, 0.06, (Math.random() - 0.5) * 0.9); m.rotation.set(Math.random(), Math.random() * 3, Math.random()); g.add(m); }
    ctx.scene.add(g); wreck = g; }
  /** a obra está coberta por uma Sentinela neste instante? */
  const covered = (t: number) => { const p = robotPos(); return ctx.sentries().some((q) => q.until >= t && Math.hypot(q.x - p.x, q.z - p.z) <= q.r); };
  function killRobot(at: number, why: string) { if (!home?.robot) return; home.robot.dead = at; saveHome(home); if (robotM) { const p = robotM.position; for (let i = 0; i < 30; i++) ctx.particles.spawn(p.x, p.y + 0.8, p.z, { vx: (Math.random() - 0.5) * 4, vy: Math.random() * 4, vz: (Math.random() - 0.5) * 4, life: 0.9, s0: 0.25, s1: 0.04, c0: 0xffd070, c1: 0x5a5a5a, a: 0.9 }); }
    showRobot(); showWreck(); ctx.log(why, '#ff9a6a'); }
  /** credita o trabalho do robô até agora (também o tempo em que o jogo esteve fechado), rolando os ataques turno a turno quando ninguém estava por perto */
  function creditRobot(now: number, offline: boolean): { turns: number; died: boolean } {
    const r = home?.robot; if (!home || !r || r.dead || home.done >= home.work) return { turns: 0, died: false };
    const end = Math.min(now, r.until); if (end <= r.last) return { turns: 0, died: false }; let t = r.last, died = false;
    if (offline) { /* um turno de cada vez: 30% de chance de um bicho passar pela obra; sem torre cobrindo naquele instante, o robô vira sucata */
      let k = Math.floor(t / TURN_MS) + 1; while (k * TURN_MS < end) { const at = k * TURN_MS, roll = (Math.sin(k * 12.9898 + home.gx * 78.233 + home.gy * 37.719) * 43758.5453) % 1; if (Math.abs(roll) < 0.3 && !covered(at)) { home.done = Math.min(home.work, home.done + (at - t) / TURN_MS); r.last = at; killRobot(at, '🦾 Um bicho passou pela obra enquanto você estava longe e destruiu o Ajudante de Obra. Sem uma Sentinela cobrindo o canteiro, ele não tem como se defender.'); died = true; break; } k++; } }
    const before = home.done; if (!died) { home.done = Math.min(home.work, home.done + (end - t) / TURN_MS); r.last = end; } saveHome(home); refresh();
    if (r.until <= now && !r.dead) { ctx.log('🦾 O Ajudante de Obra cumpriu o contrato e volta para a Companhia.', '#c8b890'); home.robot = undefined; saveHome(home); showRobot(); }
    if (home.done >= home.work) { ctx.log(`🏡 ${home.name} está pronta! Pendure a placa na frente (E) e entre: a cama cura, e a caixa de correio guarda os seus itens.`, '#ffe08a'); finish(); }
    return { turns: home.done - before, died }; }
  // abrir o jogo: recoloca o canteiro ou a casa, e acerta o que o robô fez enquanto o jogo estava fechado
  if (home && (home as HomeSave & { work: number }).work === 60) { home.work = 30; home.done = Math.min(home.done / 2, 29.9); saveHome(home); } // obras do teste de 28/10 (marteladas) viram turnos
  if (home) { if (home.done >= home.work) { ctx.addHouse(home); if (home.signed) makeSign(home); } else { ctx.block(home.gx, home.gy, home.w, home.h, true); buildSite(home); showRobot(); showWreck();
      const r0 = creditRobot(Date.now(), true); if (r0.turns > 0.05) ctx.log(`🦾 Enquanto você esteve fora, o Ajudante de Obra trabalhou ${r0.turns.toFixed(1).replace('.', ',')} turno(s). A obra está em ${home.done.toFixed(1).replace('.', ',')} de ${home.work} turnos.`, '#ffe08a'); } }
  const fmtT = (x: number) => x.toFixed(1).replace('.', ',');
  return {
    get home() { return home; },
    get working() { return working; },
    busy: () => !!home,
    start(w: Whole, gx: number, gy: number) { home = { id: w.id, name: w.name, gx, gy, w: w.w, h: w.h, work: w.work, done: 0, signed: false, owner: ctx.heroName() }; saveHome(home); ctx.block(gx, gy, w.w, w.h, true); buildSite(home);
      ctx.log(`🏗 O canteiro de ${w.name} está marcado e o material descarregado. A obra pede ${w.work} turnos de trabalho (${w.work / 6} dias de Karmika): trabalhe nela (E) entre uma aventura e outra, ou contrate um Ajudante de Obra na Caravana de Latão — e proteja-o com Sentinelas.`, '#ffe08a'); },
    /** liga/desliga o trabalho do herói na obra */
    toggleWork() { if (!home || home.done >= home.work) return; working = !working; ctx.log(working ? `🔨 Você arregaça as mangas: cada minuto aqui é obra subindo (${fmtT(home.done)} de ${home.work} turnos). Saia de perto ou aperte E para parar.` : `🔨 Você larga as ferramentas. A obra está em ${fmtT(home.done)} de ${home.work} turnos.`, '#ffe08a'); },
    /** planta o Ajudante de Obra no canteiro (tier 0..2 = Mk I, II, III: 1, 2 ou 4 turnos) */
    deployRobot(tier: number): boolean { if (!home || home.done >= home.work) { ctx.log('🦾 O Ajudante de Obra só trabalha num canteiro de obra inteira (B → Obras inteiras).', '#ff9a8a'); return false; }
      if (home.robot && !home.robot.dead && home.robot.until > Date.now()) { ctx.log('🦾 Já há um Ajudante trabalhando nesta obra.', '#ff9a8a'); return false; }
      const now = Date.now(); home.robot = { tier, until: now + [1, 2, 4][tier] * TURN_MS, last: now, hp: 100 }; saveHome(home); showRobot(); showWreck();
      ctx.log(`🦾 O Ajudante de Obra Mk ${['I', 'II', 'III'][tier]} pega o martelo: ${[1, 2, 4][tier]} turno(s) de trabalho sozinho. ${covered(now) ? 'Uma Sentinela cobre a obra.' : '⚠ Nenhuma Sentinela cobre a obra: um bicho que passar acaba com ele.'}`, covered(now) ? '#ffe08a' : '#ffb070'); return true; },
    /** desistir: o canteiro se desmancha e o material se perde (pede confirmação antes, no menu) */
    quit() { if (!home || home.done >= home.work) return false; if (site) { ctx.scene.remove(site); site = null; } if (robotM) { ctx.scene.remove(robotM); robotM = null; } if (wreck) { ctx.scene.remove(wreck); wreck = null; }
      ctx.block(home.gx, home.gy, home.w, home.h, false); const n = home.name; home = null; working = false; lastStage = -1; saveHome(null); ctx.log(`🪓 Você desistiu de ${n}. O canteiro se desfaz e o material se perde.`, '#d0a080'); return true; },
    door() { return home ? { x: (home.gx + home.w / 2) * T, z: (home.gy + home.h) * T + 0.9 } : null; },
    siteCenter() { return home && home.done < home.work ? { x: (home.gx + home.w / 2) * T, z: (home.gy + home.h) * T + 0.6, p: home.done / home.work, done: home.done, need: home.work, robot: !!(home.robot && !home.robot.dead && home.robot.until > Date.now()), covered: covered(Date.now()) } : null; },
    signAt() { return home && home.done >= home.work ? { x: (home.gx + home.w / 2 + 1.6) * T, z: (home.gy + home.h) * T + 1.2 } : null; },
    sign() { if (!home || home.done < home.work) return; home.signed = true; home.owner = ctx.heroName(); saveHome(home); makeSign(home); ctx.log(`🪧 A placa está na frente: “Casa de ${home.owner}”.`, '#ffe08a'); },
    update(dt: number, heroX: number, heroZ: number, moving: boolean, hammer: () => void) {
      if (!home || home.done >= home.work) { working = false; return; }
      const c = { x: (home.gx + home.w / 2) * T, z: (home.gy + home.h / 2) * T }, near = Math.hypot(heroX - c.x, heroZ - c.z) < Math.max(home.w, home.h) * T * 0.5 + 6;
      if (working && !near) { working = false; ctx.log(`🔨 Você se afastou da obra e o trabalho parou (${fmtT(home.done)} de ${home.work} turnos).`, '#c8b890'); }
      if (working && !moving) { home.done = Math.min(home.work, home.done + dt * 1000 / TURN_MS); armT -= dt; if (armT <= 0) { armT = 1.3; hammer(); } if (Math.random() < dt * 0.5) saveHome(home); refresh(); if (home.done >= home.work) { working = false; saveHome(home); ctx.log(`🏡 ${home.name} está pronta! Pendure a placa na frente (E) e entre.`, '#ffe08a'); finish(); return; } }
      // o robô: braço martelando; com o herói por perto, bicho de verdade perto dele e sem torre cobrindo = sucata
      if (robotM) { const arm = robotM.getObjectByName('arm'); if (arm) arm.rotation.x = -0.4 + Math.max(0, Math.sin(performance.now() / 180)) * 1.1; }
      robotT -= dt; if (robotT > 0) return; robotT = 1;
      const r = home.robot; if (r && !r.dead) { const p = robotPos(); if (ctx.heroNear(p.x, p.z, 70)) { if (ctx.enemyNear(p.x, p.z, 6) && !covered(Date.now())) { r.hp -= 25; if (r.hp <= 0) killRobot(Date.now(), '🦾 Os bichos acabaram com o Ajudante de Obra! Ele não se defende sozinho: plante Sentinelas em volta do canteiro.'); else ctx.log('🦾 O Ajudante de Obra está sendo atacado!', '#ff9a6a'); saveHome(home); } creditRobot(Date.now(), false); } else creditRobot(Date.now(), true); }
    },
  };
}
