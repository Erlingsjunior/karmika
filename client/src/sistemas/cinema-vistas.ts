/* CINEMÁTICAS DE PAISAGEM, Fontes da Visão, portas das casas e marcas de cena: tocar a cena, a câmera do menu, os olhos das vistas e os gatilhos. Saiu do main.ts (02/11). */
import { scenes, type Scene, playOverlay } from '../cinema';
import { TILE_M as T } from '@karmika/shared';
import { CATHEDRAL, ASKAVIK, CITY, heightAt, localDims, rotLocal } from '../world';
import { waterU } from '../chunks3d';
import * as THREE from 'three';
import { gpuTag } from '../gpu/tags';
import { fine } from '../dual3d';
import { houseDoor } from '../houses3d';
import type { CinemaVistasCtx } from '../main';

export function createCinemaVistas(K: CinemaVistasCtx) {
/* ---------- cinemáticas de paisagem e Fontes da Visão ---------- */
const CINE = scenes(T, CATHEDRAL, ASKAVIK, CITY, (nm) => { const p = K.city.pois.find((q) => q.name === nm); if (!p) return null; for (let r = 3; r < 9; r++) for (let a = 0; a < 8; a++) { const x = Math.round(p.x + Math.cos(a * 0.785) * r), y = Math.round(p.y + Math.sin(a * 0.785) * r); if (K.city.map[y]?.[x] === 'grass' || K.city.map[y]?.[x] === 'road') return { x: x - 4, y: y - 4 }; } return { x: p.x - 4, y: p.y - 4 }; });
if (localStorage.getItem('karmika.crypt.done') !== '1') waterU.uFoul.value.set((CATHEDRAL.x + 6) * T, (CATHEDRAL.y + 10) * T, 115 * T);
const vistaSeen = new Set<string>((() => { try { return JSON.parse(localStorage.getItem('karmika.vistas') || '[]') as string[]; } catch { return []; } })());
const cineSeen = new Set<string>((() => { try { return JSON.parse(localStorage.getItem('karmika.cine') || '[]') as string[]; } catch { return []; } })());
let cineTick = 0;
let cine: { sc: Scene; t: number; ov: { close(): void; allowSkip(): void }; skipOk?: boolean; z0: number; az0: number; x0: number; z0w: number; done?: () => void } | null = null;
function playScene(sc: Scene, done?: () => void) {
  if (cine) return; K.keys.clear(); K.state.path = []; if (K.combatMode) K.setCombat(false);
  for (const id of ['inv', 'char', 'shop', 'qlog', 'skillsw', 'featsw']) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
  document.body.classList.add('cinema'); K.objs.setRad(5); K.objs.update(K.camX, K.camZ, true);
  cine = { sc, t: 0, ov: playOverlay(sc, () => endScene()), z0: K.zoomTarget, az0: K.az, x0: K.camX, z0w: K.camZ, done };
  K.audio.hymn(sc.sec, sc.mood);
}
/** toda cena passa por uma tela de carregamento: o cenário de todos os planos é montado com a tela preta, e só então o filme começa (nada de travar no meio do jogo) */
function startScene(sc: Scene, done?: () => void) {
  if (cine || K.fading) return; K.keys.clear(); K.state.path = [];
  K.withFade(() => { K.objs.setRad(5); for (const sh of sc.shots) K.objs.update(sh.x, sh.z, true); K.objs.update(K.camX, K.camZ, true); }, `Preparando a cena — ${sc.title}`, () => playScene(sc, done));
}
function endScene() { if (!cine) return; const c = cine; cine = null; c.ov.close(); document.body.classList.remove('cinema'); K.objs.setRad(2); K.zoomTarget = c.z0; K.azT = c.az0; c.done?.(); }
/* 26/10 (Erling: "na tela de fundo coloque cada vez um lugar diferente dos lindos que já foram criados — paisagens de Karmika, e não
   o nosso personagem"): com o menu ou a criação abertos, a câmera passeia pelas Fontes da Visão, um lugar novo a cada abertura e a cada 40 s */
let mvHold = 0; let mv: { x: number; z: number; zoom: number; az: number; t: number; z0: number; az0: number } | null = null, mvLast = -1;
function menuView(rdt: number) {
  const want0 = (K.inicio.isOpen || K.creating) && !K.inside && !cine, nowM = performance.now();
  /* entre o menu fechar e a criação abrir passa um instante: a paisagem segura 0,8 s em vez de piscar a vila (Erling, 26/10) */
  if (want0) mvHold = nowM + 800; const want = want0 || (!!mv && nowM < mvHold && !K.inside && !cine);
  document.body.classList.toggle('mvista', want);
  K.social.dock(K.inicio.isOpen); document.body.classList.toggle('indock', K.inicio.isOpen);
  if (!want) { if (mv) { K.zoom = K.zoomTarget = mv.z0; K.az = K.azT = mv.az0; K.camX = K.state.fx * T; K.camZ = K.state.fy * T; K.camY = K.heroY; K.objs.update(K.camX, K.camZ, true); mv = null; } return false; }
  if (!mv || mv.t > 40) { const vs = CINE.vistas; if (!vs.length) return false; let i = Math.floor(Math.random() * vs.length); if (vs.length > 1 && i === mvLast) i = (i + 1) % vs.length; mvLast = i;
    const sh = vs[i].shots, s = sh[1 + Math.floor(Math.random() * Math.max(1, sh.length - 1))] ?? sh[0];
    mv = { x: s.x, z: s.z, zoom: Math.max(40, Math.min(80, s.zoom)), az: s.az, t: 0, z0: mv?.z0 ?? K.zoomTarget, az0: mv?.az0 ?? K.azT }; K.objs.update(s.x, s.z, true); }
  mv.t += rdt; mv.az += rdt * 0.035; /* giro bem lento, como um quadro vivo */
  K.camX = mv.x; K.camZ = mv.z; K.zoom = K.zoomTarget = mv.zoom; K.az = K.azT = mv.az; K.camY = heightAt(K.camX, K.camZ) + mv.zoom * 0.12;
  return true;
}
function updateCine(rdt: number) {
  if (!cine) return false; cine.t += rdt; const sc = cine.sc, sh = sc.shots, u = Math.min(1, cine.t / sc.sec);
  const f = u * (sh.length - 1), i = Math.min(sh.length - 2, Math.floor(f)), k = f - i, e = k * k * (3 - 2 * k), a = sh[i], b = sh[i + 1];
  // entra e sai suavemente da posição do jogador
  const inK = Math.min(1, cine.t / 2.2), outK = Math.min(1, (sc.sec - cine.t) / 2.2), w = Math.min(inK, outK), ww = w * w * (3 - 2 * w);
  const tx = THREE.MathUtils.lerp(a.x, b.x, e), tz = THREE.MathUtils.lerp(a.z, b.z, e), tzm = THREE.MathUtils.lerp(a.zoom, b.zoom, e), taz = THREE.MathUtils.lerp(a.az, b.az, e);
  const hx = K.state.fx * T, hz = K.state.fy * T;
  K.camX = THREE.MathUtils.lerp(hx, tx, ww); K.camZ = THREE.MathUtils.lerp(hz, tz, ww); K.zoom = K.zoomTarget = THREE.MathUtils.lerp(cine.z0, tzm, ww); K.az = K.azT = THREE.MathUtils.lerp(cine.az0, taz, ww);
  { /* o texto da cena ocupa a direita da tela: o assunto da cena tem que ficar no meio do espaço livre à esquerda.
       Mede onde ele aparece na tela e corrige a câmera aos poucos (sem depender do ângulo). */
    const rv = new THREE.Vector3().setFromMatrixColumn(K.camera.matrixWorld, 0); rv.y = 0; if (rv.lengthSq() > 1e-6) rv.normalize();
    const c2 = cine as typeof cine & { off?: number; offY?: number };
    // toda cinemática centraliza o que importa: o 'focus' da cena, ou (sem ele) o ponto que o plano atual está mirando
    const fp = sc.focus ? new THREE.Vector3(sc.focus.x * T, heightAt(sc.focus.x * T, sc.focus.y * T) + sc.focus.h, sc.focus.y * T) : new THREE.Vector3(tx, heightAt(tx, tz) + Math.min(8, tzm * 0.08), tz);
    fp.project(K.camera);
    if (Math.abs(fp.x) < 3 && Math.abs(fp.y) < 3) { const g = Math.min(1, rdt * 2.5); c2.off = (c2.off ?? 0) + (fp.x - -0.22) * tzm * 0.5 * g; c2.offY = (c2.offY ?? 0) + (fp.y - 0.02) * tzm * 0.25 * g; }
    const o = (c2.off ?? 0) * ww; K.camX += rv.x * o; K.camZ += rv.z * o; }
  K.camY = heightAt(K.camX, K.camZ) + (tzm * 0.16 + ((cine as { offY?: number }).offY ?? 0)) * ww; K.objs.update(K.camX, K.camZ); // olha um pouco acima do chão: o prédio aparece inteiro, no meio da tela
  if (!cine.skipOk && cine.t >= sc.sec * 0.9) { cine.skipOk = true; cine.ov.allowSkip(); } // a história inteira já passou na tela
  if (cine.t >= sc.sec) endScene();
  return true;
}
// Fontes da Visão: bacia de pedra com o Olho de cristal flutuando
/* 25/10 (Erling: "a fonte da visão estava colada numa casa qualquer; a fonte da praça, que é o marco central de cada vila e cidade, é que
   devia ser a Fonte da Visão — juntar as duas coisas numa só"): cada vila e cidade conta a sua história na própria fonte da praça */
const FONT_R = new Map<string, number>();
{ const D = Math.PI / 180, shot = (x: number, y: number, zoom: number, az: number) => ({ x: x * T, z: y * T, zoom, az: az * D });
  for (const st of K.city.settlements) {
    let f: (typeof K.city.props)[number] | null = null, bd = st.radius; for (const q of K.city.props) { if (q.kind !== 'fountain') continue; const d = Math.hypot(q.gx + q.w / 2 - st.x, q.gy + q.h / 2 - st.y); if (d < bd) { bd = d; f = q; } }
    if (!f) continue; const fx = f.gx + f.w / 2 - 0.5, fy = f.gy + f.h / 2 - 0.5;
    const old = CINE.vistas.find((v) => v.title.endsWith(`— ${st.name}`) && !FONT_R.has(v.id)) ?? CINE.vistas.find((v) => !FONT_R.has(v.id) && Math.hypot(v.at.x - st.x, v.at.y - st.y) < st.radius + 2); /* 02/11 (Erling: "a fonte da praça já é a Fonte da Visão; por que outra do lado?"): a visão que cai dentro da vila vai para a fonte da praça (Brasaforja: A Montanha Negra) */
    if (old) { old.at = { x: fx, y: fy }; old.shots[0] = shot(fx, fy, 22, 45); FONT_R.set(old.id, f.w); continue; }
    const lore = (st.npcs[0]?.lines[0] ?? '').replace(`Bem-vindo a ${st.name}. `, '');
    const id = 'v_st_' + st.name; FONT_R.set(id, f.w);
    CINE.vistas.push({ id, at: { x: fx, y: fy }, title: `Fonte da Visão — ${st.name}`, sub: st.kind === 'city' ? 'A fonte da cidade' : 'A fonte da praça', mood: 'bright', skippable: true, sec: 24,
      shots: [shot(fx, fy, 22, 45), shot(st.x, st.y, 44, 120), shot(st.x, st.y, 38, 220)],
      text: [`A fonte de ${st.name} é o coração do lugar: as estradas chegam nela, as notícias se espalham dela, e as crianças aprendem a contar com as moedas do fundo.${lore ? ' ' + lore : ''}`,
        'Como toda fonte de Karmika, esta guarda o que as almas deixam cair quando passam. Quem joga uma moeda e olha a água vê o que o lugar já viu: os que nasceram, os que partiram e os que voltaram com outro rosto.',
        'Os velhos dizem que Marghar bebe de todas as fontes ao mesmo tempo. Por isso nenhuma seca, e por isso ninguém mente com a mão na borda de pedra.'] } as (typeof CINE.vistas)[number]); } }
/* o nome do recurso nunca sai do globo: encolhe a letra até caber (DETERMINAÇÃO, ENERGIA, FÚRIA...) */
for (const u of Array.from(document.querySelectorAll<HTMLElement>('.orb u'))) { const fitU = () => { u.style.fontSize = ''; u.style.letterSpacing = ''; let fs = 8, ls = 0.16; for (let k = 0; k < 10 && u.scrollWidth > u.clientWidth + 1; k++) { if (ls > 0.04) ls -= 0.04; else fs -= 0.5; u.style.letterSpacing = ls + 'em'; u.style.fontSize = fs + 'px'; } }; new MutationObserver(fitU).observe(u, { childList: true, characterData: true, subtree: true }); setTimeout(fitU, 500); }
let shiftHeld = false; addEventListener('keydown', (e) => { shiftHeld = e.shiftKey; }, true); addEventListener('keyup', (e) => { shiftHeld = e.shiftKey; }, true);
const vistaObjs: { v: (typeof CINE.vistas)[number]; eye: THREE.Mesh; ring: THREE.Mesh; x: number; z: number; y: number; r: number }[] = [];
for (const v of CINE.vistas) {
  const g = new THREE.Group(), x = (v.at.x + 0.5) * T, z = (v.at.y + 0.5) * T, y = heightAt(x, z);
  const fw = FONT_R.get(v.id); if (fw) { /* na fonte da praça: só o Olho flutuando sobre a água e um anel dourado em volta da borda */
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.26), new THREE.MeshBasicMaterial({ color: 0xffe08a })); eye.scale.set(1.5, 0.8, 1.5); eye.position.y = 2.3 + fw * 0.35; eye.visible = false; /* 03/11 (Erling): o losango flutuando na cintura da estátua nova saiu; o anel dourado continua */ g.add(eye);
    const R0 = fw * T * 0.62; const ring = new THREE.Mesh(new THREE.RingGeometry(R0, R0 + 0.22, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); ring.position.y = 0.06; ring.visible = false; /* 03/11 (Erling: "não precisa de um círculo amarelo em volta da fonte, tire isso") */ g.add(ring);
    g.position.set(x, y, z); K.scene.add(fine(g)); vistaObjs.push({ v, eye, ring, x, z, y, r: R0 + 1.6 }); continue; }
  const st = new THREE.MeshToonMaterial({ color: 0x8a8680 }), sd = new THREE.MeshToonMaterial({ color: 0x5a5650 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.35, 10), sd); base.position.y = 0.17; g.add(base);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 0.9, 8), st); col.position.y = 0.8; g.add(col);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.4, 0.35, 12), st); bowl.position.y = 1.4; g.add(bowl);
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.66, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x6fd0ff, transparent: true, opacity: 0.85 })); water.position.y = 1.58; g.add(water);
  const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), new THREE.MeshBasicMaterial({ color: 0xffe08a })); eye.scale.set(1.5, 0.8, 1.5); eye.position.y = 2.3; g.add(eye);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.6, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); ring.position.y = 0.06; g.add(ring);
  g.position.set(x, y, z); K.scene.add(fine(g)); vistaObjs.push({ v, eye, ring, x, z, y, r: 3.6 });
}
/* luz na porta: todo lugar onde dá para entrar tem um brilho quente no batente e no chão, chamando para dentro (pool perto do herói) */
const doorTex = (() => { const c = document.createElement('canvas'); c.width = 32; c.height = 64; const g = c.getContext('2d')!; const gr = g.createLinearGradient(0, 64, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.6, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 64); const gx = g.createLinearGradient(0, 0, 32, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.25, 'rgba(0,0,0,0)'); gx.addColorStop(0.75, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, 32, 64); return new THREE.CanvasTexture(c); })();
const floorTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!; const gr = g.createRadialGradient(32, 0, 0, 32, 0, 60); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
/** onde fica a porta de cada templo em relação à borda da frente do terreno (m): a catedral e o templo de pórtico têm escadaria */
function doorZOff(p: { kind: string; variant?: number }) { const v = p.variant ?? 0; if (p.kind === 'church' && v === 2) return 2.3; if (p.kind === 'temple' && v === 20) return 2.1; if (p.kind === 'temple' && v === 13) return -6; if (p.kind === 'temple' && v >= 10) return -0.2; return 0.02; }
/** a porta de uma casa/templo no mundo (m): já com o giro da peça (rot); ry = para onde a porta olha; out = um passo para fora */
function doorOf(p: (typeof K.city.props)[number]) { const holy = p.kind !== 'house', cat = p.kind === 'church' && p.variant === 2, ld = localDims(p);
  const hd = holy ? null : houseDoor(p.variant ?? 0, ld.W, ld.D), lx = hd ? hd.x : ld.W / 2 + 0.8 * T, lz = hd ? hd.z + 0.02 : ld.D + doorZOff(p);
  const w = rotLocal(p, lx, lz), o = rotLocal(p, lx, lz + 1.6); return { x: w.x, z: w.z, ry: w.ry, out: { x: o.x, z: o.z }, w: cat ? 3.2 : hd ? hd.w * 0.95 : 2.2, h: cat ? 6.3 : hd ? hd.h : 4, yo: hd?.y ?? 0, col: cat ? 0xb08aff : holy ? 0xffe0a0 : 0xffc070, p }; }
const DOORS = K.city.props.filter((p) => p.kind === 'house' || p.kind === 'temple' || p.kind === 'church').map((p) => doorOf(p));
const DOOR_OF = new Map(DOORS.map((d) => [d.p, d]));
const doorPool = Array.from({ length: 10 }, () => { const g = new THREE.Group(); const shaft = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: doorTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); shaft.position.y = 0.5; g.add(shaft);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: floorTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); fl.position.set(0, 0.05, 0.5); g.add(fl); g.visible = false; K.scene.add(fine(g)); return { g, shaft, fl, d: null as (typeof DOORS)[number] | null }; });
let doorT = 0;
function updateDoors(dt: number) {
  if (K.inside || cine) { for (const s of doorPool) s.g.visible = false; return; }
  doorT -= dt; const hx = K.state.fx * T, hz = K.state.fy * T;
  if (doorT <= 0) { doorT = 0.5; const near = DOORS.map((d) => ({ d, k: Math.hypot(d.x - hx, d.z - hz) })).filter((o) => o.k < 45).sort((a, b) => a.k - b.k).slice(0, doorPool.length);
    doorPool.forEach((s, i) => { const d = near[i]?.d ?? null; s.d = d; s.g.visible = !!d; if (!d) return; const y = heightAt(d.out.x, d.out.z);
      s.g.position.set(d.x + Math.sin(d.ry) * 0.18, Math.max(y, 0) + d.yo, d.z + Math.cos(d.ry) * 0.18); s.g.rotation.y = d.ry; /* a luz fica À FRENTE da porta e do batente (+0,14): a 3 cm ela ficava metade dentro da porta e piscava */ s.shaft.scale.set(d.w, d.h, 1); s.shaft.position.y = d.h / 2; s.fl.scale.set(Math.min(4, d.w * 2.2), Math.min(3, d.w * 1.6), 1); s.fl.position.z = Math.min(1.5, d.w * 0.8);
      (s.shaft.material as THREE.MeshBasicMaterial).color.setHex(d.col); (s.fl.material as THREE.MeshBasicMaterial).color.setHex(d.col); s.shaft.visible = d.p.kind === 'house'; /* igreja: o portal de pedra já é a moldura; a luz fica só no chão */ }); }
  const pulse = 0.75 + 0.25 * Math.sin(performance.now() / 700), nk = 0.35 + 0.65 * K.state.night;
  for (const s of doorPool) if (s.d) { const lock = s.d.p.kind === 'church' && s.d.p.variant === 2 && K.state.night < 0.5; const k = (lock ? 0.15 : 1) * pulse * nk;
    (s.shaft.material as THREE.MeshBasicMaterial).opacity = 0.55 * k; (s.fl.material as THREE.MeshBasicMaterial).opacity = 0.45 * k; }
}
function useVista(v: (typeof CINE.vistas)[number]) {
  if (K.game.st.gold < 1) { K.game.logMsg('A Fonte da Visão pede uma moeda.', '#ff9a8a'); return; }
  K.game.st.gold -= 1; K.audio.coins(1); K.game.logMsg(`🪙 Você joga uma moeda na ${v.title.split(' — ')[0]}...`, '#ffe08a');
  const first = !vistaSeen.has(v.id);
  startScene(v, () => { if (first) { vistaSeen.add(v.id); try { localStorage.setItem('karmika.vistas', JSON.stringify([...vistaSeen])); } catch { /* */ } K.game.gainXp(Math.round(K.game.xpNeed() * 0.12)); K.game.logMsg(`👁 Visão descoberta: ${v.title.split(' — ')[1]} (${vistaSeen.size}/${CINE.vistas.length})`, '#ffe08a'); } });
}
/* Marcas do Destino: uma cena obrigatória nunca dispara do nada. Um círculo de luz no chão marca onde a história começa;
   ao chegar perto o jogo avisa, e só quando o jogador pisa na marca vem o carregamento e depois o filme. */
// marcas em pontos abertos escolhidos à mão (no meio da Avenida dos Anjos, longe das estátuas e árvores)
const CINE_MARKS: { id: string; x: number; y: number }[] = [{ id: 'cat_arrival', x: CATHEDRAL.x + 4.5, y: CATHEDRAL.y + 27.5 }];
const markTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!; g.translate(128, 128); g.strokeStyle = '#ffe2a0'; g.fillStyle = '#ffe2a0'; g.lineWidth = 6;
  g.beginPath(); g.arc(0, 0, 116, 0, 6.283); g.stroke(); g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 98, 0, 6.283); g.stroke();
  for (let k = 0; k < 12; k++) { g.save(); g.rotate(k / 12 * 6.283); g.fillRect(-3, -112, 6, 12); g.restore(); }
  g.lineWidth = 5; g.beginPath(); g.ellipse(0, 0, 58, 30, 0, 0, 6.283); g.stroke(); g.beginPath(); g.arc(0, 0, 14, 0, 6.283); g.fill(); // o Olho
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const marks = CINE_MARKS.filter((m) => !cineSeen.has(m.id)).map((m) => {
  const grp = new THREE.Group(), x = m.x * T, z = m.y * T; let gy = -1e9; for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) gy = Math.max(gy, heightAt(x + i * 1.2, z + j * 1.2)); grp.position.set(x, gy + 0.22, z); K.scene.add(grp); // o chão de pedra ondula: fica acima do ponto mais alto embaixo do círculo
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ map: markTex, alphaTest: 0.35, color: 0xffd27a, toneMapped: false, fog: false })); disc.rotation.x = -Math.PI / 2; disc.renderOrder = 5; grp.add(disc);
  const beamG = new THREE.CylinderGeometry(1.3, 1.6, 9, 20, 1, true); beamG.translate(0, 4.5, 0);
  const beam = new THREE.Mesh(beamG, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uT: { value: 0 } },
    vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying vec2 vU; uniform float uT; void main(){ float a = pow(1.0 - vU.y, 2.2) * (0.55 + 0.25*sin(vU.x*37.7 + uT*2.0)); gl_FragColor = vec4(vec3(1.0,0.78,0.38)*a, a); }' }));
  gpuTag(beam.material, 'beam', (beam.material as THREE.ShaderMaterial).uniforms); grp.add(beam); const lamp = new THREE.PointLight(0xffc860, 3, 12); lamp.position.y = 1.5; grp.add(lamp);
  return { ...m, grp, disc, beam, warned: false, gone: false };
});
function updateMarks(dt: number, t: number) {
  for (const mk of marks) { if (mk.gone) continue; mk.grp.visible = !K.inside; mk.disc.rotation.z = t * 0.4; (mk.beam.material as THREE.ShaderMaterial).uniforms.uT.value = t; (mk.disc.material as THREE.MeshBasicMaterial).color.setScalar(0.8 + 0.35 * Math.sin(t * 2.4)).multiply(new THREE.Color(0xffd27a));
    if (Math.random() < dt * 10) K.particles.spawn(mk.grp.position.x + (Math.random() - 0.5) * 2.4, mk.grp.position.y + 0.1, mk.grp.position.z + (Math.random() - 0.5) * 2.4, { vy: 1.4 + Math.random() * 1.6, life: 1.6, s0: 0.14, s1: 0.02, c0: 0xfff0c0, c1: 0xffa040, a: 0.9 }); }
}
function checkCineTriggers() {
  if (cine || K.inside || K.fading) return;
  const hx = K.state.fx * T, hz = K.state.fy * T;
  for (const mk of marks) { if (mk.gone) continue; const d = Math.hypot(hx - mk.grp.position.x, hz - mk.grp.position.z), sc = CINE.list.find((q) => q.id === mk.id); if (!sc) continue;
    if (!mk.warned && d < 30) { mk.warned = true; K.game.logMsg(`✦ Uma Marca do Destino brilha à frente: “${sc.title}”. Pise no círculo de luz quando estiver pronto — a história vai começar e o mundo para enquanto ela é contada.`, '#ffd88a'); }
    if (d < 1.7) { mk.gone = true; K.scene.remove(mk.grp); cineSeen.add(sc.id); try { localStorage.setItem('karmika.cine', JSON.stringify([...cineSeen])); } catch { /* */ } startScene(sc); } }
}
  return { get cine() { return cine; }, CINE, vistaSeen, endScene, DOOR_OF, CINE_MARKS, vistaObjs, useVista, get shiftHeld() { return shiftHeld; }, updateMarks, updateCine, menuView, updateDoors, get cineTick() { return cineTick; }, set cineTick(v: typeof cineTick) { cineTick = v; }, checkCineTriggers };
}
