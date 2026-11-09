/* O TELEFÉRICO DE CIPÓ DA COPA (09/11, Erling: "uma ligação de cipós entre as vilas pequenas e a vila central, para ir de teleférico;
   vemos o teleférico funcionando enquanto jogamos, e podemos ir lá em cima e ir de uma cidade para outra").
   - Uma torre de tronco com plataforma e lanterna azul em cada parada; cabos de cipó trançado entre as torres, com barriga.
   - Cestos de vime correm o tempo todo pelos cabos, indo e voltando — vê-se de qualquer lugar perto.
   - Na torre, E abre o embarque: qualquer parada da rede, 15 de ouro (a viagem é uma passagem com tela de transição). */
import * as THREE from 'three';
import { TILE_M as T } from '@karmika/shared';
import { heightAt, type World } from '../world';

export interface TelefericoCtx {
  readonly scene: THREE.Scene; readonly city: World; readonly game: { st: { gold: number }; logMsg(t: string, c?: string): void };
  readonly state: { fx: number; fy: number; path: unknown[] }; readonly withFade: (fn: () => void, label?: string) => void;
  readonly objs: { update(x: number, z: number, force?: boolean): void }; heroY: number; camX: number; camZ: number; camY: number;
}
const LINES: string[][] = [['Lithendel', 'Tirnael', 'Lindorië', 'Elendor-das-Cinzas'], ['Lithendel', 'Nimbrethil', 'Lómenor-do-Lago', 'Sereth', 'Morthil']];
const PRICE = 15, TH = 11;

export function createTeleferico(K: TelefericoCtx) {
  const occ = new Set<number>(); for (const p of K.city.props) for (let y = p.gy - 1; y <= p.gy + p.h; y++) for (let x = p.gx - 1; x <= p.gx + p.w; x++) occ.add(y * 4096 + x);
  const okT = (x: number, y: number) => { const t = K.city.map[y]?.[x]; return (t === 'grass' || t === 'plaza') && !occ.has(y * 4096 + x); };
  const stops = new Map<string, { name: string; x: number; z: number; top: THREE.Vector3 }>();
  for (const name of new Set(LINES.flat())) { const st = K.city.settlements.find((q) => q.name === name); if (!st) continue;
    const r0 = name === 'Lithendel' ? 14 : 6; let fx = 0, fy = 0, ok = false;
    for (let r = 0; r <= 10 && !ok; r++) for (let k = 0; k < Math.max(1, r * 8) && !ok; k++) { const a = k / Math.max(1, r * 8) * Math.PI * 2, x = Math.round(st.x + r0 * 0.7 + Math.cos(a) * r), y = Math.round(st.y - r0 * 0.7 + Math.sin(a) * r); if (okT(x, y) && okT(x + 1, y) && okT(x, y + 1)) { fx = x; fy = y; ok = true; } }
    if (!ok) continue; const x = (fx + 0.5) * T, z = (fy + 0.5) * T; stops.set(name, { name, x, z, top: new THREE.Vector3(x, heightAt(x, z) + TH, z) }); }
  /* as torres */
  const wood = new THREE.MeshToonMaterial({ color: 0x6a4a2c }), woodL = new THREE.MeshToonMaterial({ color: 0xb8a070 }), vine = new THREE.MeshToonMaterial({ color: 0x4a6a2a }), wick = new THREE.MeshToonMaterial({ color: 0xa88a50 });
  const glow = new THREE.MeshBasicMaterial({ color: 0xbfe8ff, toneMapped: false });
  const root = new THREE.Group(); root.name = 'teleferico'; K.scene.add(root);
  for (const s of stops.values()) { const g = new THREE.Group(), y0 = heightAt(s.x, s.z); g.position.set(s.x, y0, s.z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.8, TH + 0.6, 9), wood); trunk.position.y = (TH + 0.6) / 2; g.add(trunk);
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.25, 14), woodL); deck.position.y = TH - 1.4; g.add(deck);
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.4, br = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.4, 5), wood); br.position.set(Math.cos(a) * 0.9, TH - 2.4, Math.sin(a) * 0.9); br.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); g.add(br); }
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.09, 6, 16), wood); wheel.position.y = TH; wheel.rotation.x = Math.PI / 2; g.add(wheel); g.userData.wheel = wheel;
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), glow); lamp.position.set(1.7, TH - 0.6, 0); g.add(lamp);
    /* a escada de cipó (enfeite): espiral de degraus subindo pelo tronco */
    for (let i = 0; i < 26; i++) { const a = i * 0.55, st2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.32), woodL); st2.position.set(Math.cos(a) * 1.05, 0.4 + i * (TH - 1.9) / 26, Math.sin(a) * 1.05); st2.rotation.y = -a; g.add(st2); }
    root.add(g); }
  /* os cabos e os cestos */
  const cabs: { a: THREE.Vector3; b: THREE.Vector3; sag: number; baskets: { g: THREE.Group; t: number; sp: number }[] }[] = [];
  const at = (c: (typeof cabs)[number], t: number, out: THREE.Vector3) => out.copy(c.a).lerp(c.b, t).setY(c.a.y + (c.b.y - c.a.y) * t - c.sag * 4 * t * (1 - t));
  const mkBasket = () => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.65, 0.9, 10, 1, true), wick); b.material.side = THREE.DoubleSide; b.position.y = -1.9; g.add(b);
    const fl = new THREE.Mesh(new THREE.CircleGeometry(0.65, 10), wick); fl.rotation.x = -Math.PI / 2; fl.position.y = -2.35; g.add(fl);
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2, rp = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 4), vine); rp.position.set(Math.cos(a) * 0.4, -0.75, Math.sin(a) * 0.4); rp.rotation.set(-Math.sin(a) * 0.45, 0, Math.cos(a) * 0.45); g.add(rp); }
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), glow); l.position.y = -1.3; g.add(l); return g; };
  for (const line of LINES) for (let i = 0; i < line.length - 1; i++) { const A = stops.get(line[i]), B = stops.get(line[i + 1]); if (!A || !B) continue;
    const c = { a: A.top.clone(), b: B.top.clone(), sag: Math.min(6, A.top.distanceTo(B.top) * 0.035), baskets: [] as { g: THREE.Group; t: number; sp: number }[] };
    const pts: THREE.Vector3[] = []; for (let k = 0; k <= 40; k++) pts.push(at(c, k / 40, new THREE.Vector3()));
    for (const off of [-0.35, 0.35]) { const shifted = pts.map((p) => p.clone().add(new THREE.Vector3(-(c.b.z - c.a.z), 0, c.b.x - c.a.x).normalize().multiplyScalar(off)));
      root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(shifted), 60, 0.06, 4, false), vine)); }
    const L = c.a.distanceTo(c.b); for (let k = 0; k < 2; k++) { const g = mkBasket(); root.add(g); c.baskets.push({ g, t: k * 0.5 + i * 0.13, sp: 1 / Math.max(20, L / 3.2) }); }
    cabs.push(c); }
  /* o embarque */
  const el = document.createElement('div'); el.id = 'teleferico'; el.className = 'pn'; el.style.cssText = 'display:none;position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:40;min-width:340px;max-width:440px;padding:14px 18px;';
  document.body.appendChild(el); let here: string | null = null;
  function open(from: string) { here = from; const g = K.game.st.gold;
    el.innerHTML = `<h2>🌿 Teleférico de Cipó — ${from}<button data-x style="float:right">✕</button></h2><p class="nvtxt">O cesteiro segura a corda: <i>"Cesto firme, cipó novo, vento a favor. Para onde?"</i> · ${PRICE} de ouro</p><div class="nvlist">${[...stops.keys()].filter((n) => n !== from).map((n) => `<div class="nvrow"><div><b>${n}</b></div><button data-go="${n}" class="gold" ${g < PRICE ? 'disabled' : ''}>🧺 ${PRICE}</button></div>`).join('')}</div>`;
    el.style.display = 'block'; }
  const close = () => { here = null; el.style.display = 'none'; };
  el.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-x]')) { close(); return; }
    const go = (t.closest('[data-go]') as HTMLElement | null)?.dataset.go; if (!go || !here) return; if (K.game.st.gold < PRICE) return; const to = stops.get(go); if (!to) return;
    K.game.st.gold -= PRICE; close();
    K.withFade(() => { K.state.fx = to.x / T + 1.2; K.state.fy = to.z / T + 1.2; K.state.path = []; K.objs.update(K.state.fx * T, K.state.fy * T, true); K.heroY = heightAt(K.state.fx * T, K.state.fy * T); K.camX = K.state.fx * T; K.camZ = K.state.fy * T; K.camY = K.heroY;
      K.game.logMsg(`🌿 O cesto desce devagar na plataforma de ${to.name}. Lá de cima, a mata inteira parecia um tapete.`, '#9ad8a0'); }, '🌿 O cesto de vime corre pelo cipó, por cima das copas…'); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && here) close(); });
  function interact(hx: number, hz: number) { let best: string | null = null, bd = 1e9; for (const s of stops.values()) { const d = Math.hypot(s.x - hx, s.z - hz); if (d < bd) { bd = d; best = s.name; } }
    if (!best || bd > 4.5) return null; const b = best; return { d: bd, label: `E — Teleférico de Cipó (${PRICE} de ouro)`, act: () => open(b) }; }
  const tmp = new THREE.Vector3(); let tt = 0;
  function update(dt: number) { tt += dt; const near = (p: THREE.Vector3) => Math.abs(p.x - K.camX) < 240 && Math.abs(p.z - K.camZ) < 240;
    for (const c of cabs) { const vis = near(c.a) || near(c.b) || near(tmp.copy(c.a).lerp(c.b, 0.5)); for (const b of c.baskets) { b.g.visible = vis; if (!vis) continue; b.t = (b.t + dt * b.sp) % 2; const f = b.t < 1 ? b.t : 2 - b.t, e = f * f * (3 - 2 * f); at(c, e, b.g.position); b.g.rotation.z = Math.sin(tt * 1.3 + b.t * 7) * 0.05; } }
    for (const g of root.children) { const w = g.userData.wheel as THREE.Mesh | undefined; if (w) w.rotation.z += dt * 1.4; } }
  return { interact, update, close, get open() { return !!here; }, stops };
}
