/* O TELEFÉRICO DE CIPÓ DA COPA (09/11, Erling: "uma ligação de cipós entre as vilas pequenas e a vila central, para ir de teleférico;
   vemos o teleférico funcionando enquanto jogamos, e podemos ir lá em cima e ir de uma cidade para outra").
   Refeito no mesmo dia (Erling: "não sei como subir naquela torre sem cair: a escada precisa ser mais larga, com corrimão, e a torre mais
   robusta — ou clicamos e o boneco vai sozinho; nós jogadores vamos usar o teleférico porque é divertido"; "precisa de torres que seguram os
   cipós no caminho: nenhum cipó aguentaria essa distância sem quebrar"):
   - Estação: tronco grosso com raízes-contraforte, escada em caracol larga com corrimão dos dois lados, plataforma com guarda-corpo, roda e
     lanterna azul.
   - No caminho, a cada ~36 m, uma torre de apoio (tronco com cruzeta e roldanas). O cipó vai de apoio em apoio, com barriga em cada vão.
   - Cestos de vime correm o tempo todo pelos cabos.
   - Na base, E abre o embarque (15 de ouro). O herói sobe a escada sozinho, entra no cesto e VIAJA de verdade pelo cipó, passando por cima
     das copas e pelas estações do meio, e desce a escada no destino. */
import * as THREE from 'three';
import { TILE_M as T } from '@karmika/shared';
import { heightAt, WL, type World } from '../world';

export interface TelefericoCtx {
  readonly scene: THREE.Scene; readonly city: World; readonly game: { st: { gold: number }; logMsg(t: string, c?: string): void };
  readonly state: { fx: number; fy: number; path: unknown[] }; readonly withFade: (fn: () => void, label?: string) => void;
  readonly objs: { update(x: number, z: number, force?: boolean): void }; heroY: number; camX: number; camZ: number; camY: number;
}
const LINES: string[][] = [['Lithendel', 'Tirnael', 'Lindorië', 'Elendor-das-Cinzas'], ['Lithendel', 'Nimbrethil', 'Lómenor-do-Lago', 'Sereth', 'Morthil']];
const PRICE = 15, TH = 12, DECK = TH - 1.6, SPAN = 36, RIDE_V = 15, CLIMB_V = 4, STAIR_R = 2.9, HANG = 2.3;
const gy = (x: number, z: number) => Math.max(heightAt(x, z), WL);

export function createTeleferico(K: TelefericoCtx) {
  const occ = new Set<number>(); for (const p of K.city.props) for (let y = p.gy - 1; y <= p.gy + p.h; y++) for (let x = p.gx - 1; x <= p.gx + p.w; x++) occ.add(y * 4096 + x);
  const okT = (x: number, y: number) => { const t = K.city.map[y]?.[x]; return (t === 'grass' || t === 'plaza') && !occ.has(y * 4096 + x); };
  type Stop = { name: string; x: number; z: number; y0: number; top: THREE.Vector3; climb: THREE.Vector3[] };
  const stops = new Map<string, Stop>();
  for (const name of new Set(LINES.flat())) { const st = K.city.settlements.find((q) => q.name === name); if (!st) continue;
    const r0 = name === 'Lithendel' ? 14 : 6; let fx = 0, fy = 0, ok = false;
    for (const half of [2, 1, 0]) for (let r = 0; r <= 16 && !ok; r++) for (let k = 0; k < Math.max(1, r * 8) && !ok; k++) { const a = k / Math.max(1, r * 8) * Math.PI * 2, x = Math.round(st.x + r0 * 0.7 + Math.cos(a) * r), y = Math.round(st.y - r0 * 0.7 + Math.sin(a) * r);
      let all = true; for (let yy = -half; yy <= half && all; yy++) for (let xx = -half; xx <= half; xx++) if (!okT(x + xx, y + yy)) { all = false; break; } if (all) { fx = x; fy = y; ok = true; } }
    if (!ok) continue; const x = (fx + 0.5) * T, z = (fy + 0.5) * T, y0 = heightAt(x, z);
    /* o caminho da escada: espiral de fora, do chão até a plataforma (2,1 voltas) */
    const climb: THREE.Vector3[] = []; const turns = 1.6, n = 60; for (let i = 0; i <= n; i++) { const f = i / n, a = f * turns * Math.PI * 2; climb.push(new THREE.Vector3(x + Math.cos(a) * STAIR_R, y0 + 0.1 + f * DECK, z + Math.sin(a) * STAIR_R)); }
    stops.set(name, { name, x, z, y0, top: new THREE.Vector3(x, y0 + TH, z), climb }); }

  /* materiais */
  const wood = new THREE.MeshToonMaterial({ color: 0x6a4a2c }), woodD = new THREE.MeshToonMaterial({ color: 0x4e341e }), woodL = new THREE.MeshToonMaterial({ color: 0xb8a070 }), vine = new THREE.MeshToonMaterial({ color: 0x4a6a2a }), wick = new THREE.MeshToonMaterial({ color: 0xa88a50 });
  const glow = new THREE.MeshBasicMaterial({ color: 0xbfe8ff, toneMapped: false });
  const root = new THREE.Group(); root.name = 'teleferico'; K.scene.add(root);
  const cyl = (rt: number, rb: number, h: number, seg: number, m: THREE.Material) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  /* um tubo entre dois pontos (para corrimão, cordas e braços) */
  const rod = (a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material) => { const d = b.clone().sub(a), o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 5), m); o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return o; };

  /* as estações */
  for (const s of stops.values()) { const g = new THREE.Group(); g.position.set(s.x, s.y0, s.z);
    const trunk = cyl(1.0, 1.6, TH + 0.6, 12, wood); trunk.position.y = (TH + 0.6) / 2; g.add(trunk);
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.3, rt = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.5, 3.4, 6), woodD); rt.position.set(Math.cos(a) * 1.6, 1.1, Math.sin(a) * 1.6); rt.rotation.set(Math.sin(a) * 0.75, 0, -Math.cos(a) * 0.75); g.add(rt); }
    const deck = cyl(STAIR_R + 0.9, STAIR_R + 0.9, 0.3, 18, woodL); deck.position.y = DECK; g.add(deck);
    for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; if (Math.abs(((a - 0.0) + Math.PI) % (Math.PI * 2) - Math.PI) < 0.35) continue; /* a abertura do topo da escada */
      const p = new THREE.Vector3(Math.cos(a) * (STAIR_R + 0.75), DECK + 0.55, Math.sin(a) * (STAIR_R + 0.75)); const post = cyl(0.06, 0.06, 1.1, 5, woodD); post.position.copy(p); g.add(post);
      const a2 = (k + 1) / 18 * Math.PI * 2; g.add(rod(new THREE.Vector3(Math.cos(a) * (STAIR_R + 0.75), DECK + 1.05, Math.sin(a) * (STAIR_R + 0.75)), new THREE.Vector3(Math.cos(a2) * (STAIR_R + 0.75), DECK + 1.05, Math.sin(a2) * (STAIR_R + 0.75)), 0.045, vine)); }
    /* a escada larga: degraus de 1,9 m em caracol, com corrimão por dentro (no tronco) e por fora */
    const turns = 1.6, nSt = 44; let prevO: THREE.Vector3 | null = null, prevI: THREE.Vector3 | null = null;
    for (let i = 0; i <= nSt; i++) { const f = i / nSt, a = f * turns * Math.PI * 2, y = 0.1 + f * DECK;
      const st = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 0.62), woodL); st.position.set(Math.cos(a) * STAIR_R, y, Math.sin(a) * STAIR_R); st.rotation.y = -a; g.add(st);
      const o = new THREE.Vector3(Math.cos(a) * (STAIR_R + 0.95), y + 1.0, Math.sin(a) * (STAIR_R + 0.95)), ii = new THREE.Vector3(Math.cos(a) * (STAIR_R - 0.95), y + 1.0, Math.sin(a) * (STAIR_R - 0.95));
      if (i % 3 === 0) { const po = cyl(0.05, 0.05, 1.0, 4, woodD); po.position.set(o.x, y + 0.5, o.z); g.add(po); }
      if (prevO && prevI) { g.add(rod(prevO, o, 0.05, vine)); g.add(rod(prevI, ii, 0.04, vine)); } prevO = o; prevI = ii;
      if (i % 9 === 4) { const br = rod(new THREE.Vector3(Math.cos(a) * 1.1, y - 1.4, Math.sin(a) * 1.1), new THREE.Vector3(Math.cos(a) * STAIR_R, y - 0.05, Math.sin(a) * STAIR_R), 0.09, woodD); g.add(br); } }
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.1, 6, 16), wood); wheel.position.y = TH; wheel.rotation.x = Math.PI / 2; g.add(wheel); g.userData.wheel = wheel;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.8, 9), new THREE.MeshToonMaterial({ color: 0x5a7a3a })); roof.position.y = TH + 1.6; g.add(roof);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), glow); lamp.position.set(STAIR_R + 0.75, DECK + 1.4, 0.4); g.add(lamp);
    root.add(g); }

  /* os vãos: estação → apoios → estação; cada vão tem barriga própria */
  type Seg = { a: string; b: string; pts: THREE.Vector3[]; cum: number[]; len: number; baskets: { g: THREE.Group; t: number; sp: number }[] };
  const segs: Seg[] = [];
  const mkBasket = () => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.75, 1.0, 10, 1, true), wick); b.material.side = THREE.DoubleSide; b.position.y = -1.85; g.add(b);
    const fl = new THREE.Mesh(new THREE.CircleGeometry(0.75, 10), wick); fl.rotation.x = -Math.PI / 2; fl.position.y = -2.33; g.add(fl);
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; g.add(rod(new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(a) * 0.85, -1.35, Math.sin(a) * 0.85), 0.025, vine)); }
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), glow); l.position.y = -0.4; g.add(l); return g; };
  const pylon = (x: number, z: number, dir: THREE.Vector3) => { const y0 = gy(x, z), g = new THREE.Group(); g.position.set(x, y0, z);
    const tr = cyl(0.45, 0.8, TH + 0.4, 9, wood); tr.position.y = (TH + 0.4) / 2; g.add(tr);
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + 0.5; g.add(rod(new THREE.Vector3(Math.cos(a) * 2.2, 0, Math.sin(a) * 2.2), new THREE.Vector3(Math.cos(a) * 0.4, 3.2, Math.sin(a) * 0.4), 0.16, woodD)); }
    const side = new THREE.Vector3(-dir.z, 0, dir.x).normalize(); g.add(rod(side.clone().multiplyScalar(-1.3).setY(TH - 0.2), side.clone().multiplyScalar(1.3).setY(TH - 0.2), 0.14, woodD));
    for (const s of [-0.9, 0.9]) { const wh = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 5, 12), woodL); wh.position.copy(side.clone().multiplyScalar(s)).setY(TH); wh.rotation.y = Math.atan2(dir.x, dir.z) + Math.PI / 2; g.add(wh); }
    for (let i = 0; i < 10; i++) { const a = i * 1.7, h = 1 + i * 1.05; const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), vine); lf.position.set(Math.cos(a) * 0.6, h, Math.sin(a) * 0.6); g.add(lf); }
    root.add(g); return new THREE.Vector3(x, y0 + TH, z); };
  const done = new Set<string>();
  for (const line of LINES) for (let i = 0; i < line.length - 1; i++) { const A = stops.get(line[i]), B = stops.get(line[i + 1]); if (!A || !B) continue; const key = [A.name, B.name].sort().join('|'); if (done.has(key)) continue; done.add(key);
    const dir = B.top.clone().sub(A.top).setY(0), L = dir.length(); dir.normalize(); const n = Math.max(1, Math.round(L / SPAN));
    const sup = [A.top.clone()]; for (let k = 1; k < n; k++) { const f = k / n; sup.push(pylon(A.x + (B.x - A.x) * f, A.z + (B.z - A.z) * f, dir)); } sup.push(B.top.clone());
    const pts: THREE.Vector3[] = []; for (let k = 0; k < sup.length - 1; k++) { const a = sup[k], b = sup[k + 1], sag = Math.min(2.6, a.distanceTo(b) * 0.045);
      for (let j = k === 0 ? 0 : 1; j <= 16; j++) { const t = j / 16; pts.push(a.clone().lerp(b, t).setY(a.y + (b.y - a.y) * t - sag * 4 * t * (1 - t))); } }
    for (const off of [-0.9, 0.9]) { const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(off); root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => p.clone().add(side))), pts.length * 2, 0.07, 4, false), vine)); }
    const cum = [0]; for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + pts[k].distanceTo(pts[k - 1]));
    const sg: Seg = { a: A.name, b: B.name, pts, cum, len: cum[cum.length - 1], baskets: [] };
    for (let k = 0; k < 2; k++) { const g = mkBasket(); root.add(g); sg.baskets.push({ g, t: k * 0.5 + i * 0.13, sp: 1 / Math.max(20, sg.len / 3.2) }); }
    segs.push(sg); }
  const along = (pts: THREE.Vector3[], cum: number[], d: number, out: THREE.Vector3) => { let k = 1; while (k < cum.length - 1 && cum[k] < d) k++; const u = (d - cum[k - 1]) / Math.max(1e-6, cum[k] - cum[k - 1]); return out.copy(pts[k - 1]).lerp(pts[k], Math.min(1, Math.max(0, u))); };

  /* a viagem: rota de estação em estação (busca no grafo), subida, cesto, descida */
  function route(from: string, to: string): string[] | null { const prev = new Map<string, string>([[from, from]]), q = [from];
    while (q.length) { const c = q.shift()!; if (c === to) break; for (const s of segs) { const n = s.a === c ? s.b : s.b === c ? s.a : null; if (n && !prev.has(n)) { prev.set(n, c); q.push(n); } } }
    if (!prev.has(to)) return null; const out = [to]; while (out[0] !== from) out.unshift(prev.get(out[0])!); return out; }
  type Leg = { pts: THREE.Vector3[]; cum: number[]; len: number; v: number; walk: boolean; basket: boolean };
  const mkLeg = (pts: THREE.Vector3[], v: number, walk: boolean, basket: boolean): Leg => { const cum = [0]; for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + pts[k].distanceTo(pts[k - 1])); return { pts, cum, len: cum[cum.length - 1], v, walk, basket }; };
  let trip: { legs: Leg[]; i: number; d: number; to: string; cab: THREE.Group } | null = null;
  const carry = { x: 0, z: 0, y: 0, yaw: 0, walk: false };
  function start(from: string, to: string) { const r = route(from, to); if (!r) return false; const A = stops.get(from)!, B = stops.get(to)!;
    const legs: Leg[] = [mkLeg(A.climb, CLIMB_V, true, false)];
    const hang = new THREE.Vector3(0, -HANG, 0);
    legs.push(mkLeg([A.climb[A.climb.length - 1], A.top.clone().add(hang)], 1.6, true, false));
    const ride: THREE.Vector3[] = []; for (let k = 0; k < r.length - 1; k++) { const s = segs.find((q) => (q.a === r[k] && q.b === r[k + 1]) || (q.b === r[k] && q.a === r[k + 1]))!; const p = s.a === r[k] ? s.pts : [...s.pts].reverse(); for (const v of p) ride.push(v.clone().add(hang)); }
    legs.push(mkLeg(ride, RIDE_V, false, true));
    legs.push(mkLeg([B.top.clone().add(hang), B.climb[B.climb.length - 1]], 1.6, true, false));
    legs.push(mkLeg([...B.climb].reverse(), CLIMB_V, true, false));
    const cab = mkBasket(); cab.visible = false; root.add(cab); trip = { legs, i: 0, d: 0, to, cab }; return true; }

  /* o embarque */
  const el = document.createElement('div'); el.id = 'teleferico'; el.className = 'pn'; el.style.cssText = 'display:none;position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:40;min-width:340px;max-width:440px;padding:14px 18px;';
  document.body.appendChild(el); let here: string | null = null;
  function open(from: string) { here = from; const g = K.game.st.gold;
    el.innerHTML = `<h2>🌿 Teleférico de Cipó — ${from}<button data-x style="float:right">✕</button></h2><p class="nvtxt">O cesteiro segura a corda: <i>"Cesto firme, cipó novo, vento a favor. Suba a escada, entre no cesto e segure-se. Para onde?"</i> · ${PRICE} de ouro</p><div class="nvlist">${[...stops.keys()].filter((n) => n !== from && route(from, n)).map((n) => `<div class="nvrow"><div><b>${n}</b></div><button data-go="${n}" class="gold" ${g < PRICE ? 'disabled' : ''}>🧺 ${PRICE}</button></div>`).join('')}</div>`;
    el.style.display = 'block'; }
  const close = () => { here = null; el.style.display = 'none'; };
  el.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-x]')) { close(); return; }
    const go = (t.closest('[data-go]') as HTMLElement | null)?.dataset.go; if (!go || !here) return; if (K.game.st.gold < PRICE) return; const from = here; close();
    if (!start(from, go)) return; K.game.st.gold -= PRICE; K.game.logMsg(`🌿 Você sobe a escada de cipó. Lá em cima, o cesto balança esperando. Destino: ${go}.`, '#9ad8a0'); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && here) close(); });
  function interact(hx: number, hz: number) { if (trip) return null; let best: string | null = null, bd = 1e9; for (const s of stops.values()) { const d = Math.hypot(s.x - hx, s.z - hz); if (d < bd) { bd = d; best = s.name; } }
    if (!best || bd > 6) return null; const b = best; return { d: bd, label: `E — Teleférico de Cipó (${PRICE} de ouro)`, act: () => open(b) }; }

  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(); let tt = 0;
  function update(dt: number) { tt += dt; const near = (p: THREE.Vector3) => Math.abs(p.x - K.camX) < 240 && Math.abs(p.z - K.camZ) < 240;
    for (const c of segs) { const vis = near(c.pts[0]) || near(c.pts[c.pts.length - 1]) || near(c.pts[c.pts.length >> 1]); for (const b of c.baskets) { b.g.visible = vis; if (!vis) continue; b.t = (b.t + dt * b.sp) % 2; const f = b.t < 1 ? b.t : 2 - b.t, e = f * f * (3 - 2 * f); along(c.pts, c.cum, e * c.len, b.g.position); b.g.rotation.z = Math.sin(tt * 1.3 + b.t * 7) * 0.05; } }
    for (const g of root.children) { const w = g.userData.wheel as THREE.Mesh | undefined; if (w) w.rotation.z += dt * 1.4; }
    if (trip) { const L = trip.legs[trip.i]; trip.d += dt * L.v;
      if (trip.d >= L.len) { trip.d = 0; trip.i++; if (trip.i >= trip.legs.length) { const to = trip.to; root.remove(trip.cab); trip = null; carry.walk = false;
        K.game.logMsg(`🌿 Pés no chão de ${to}. Lá de cima, a mata inteira parecia um tapete.`, '#9ad8a0'); return; } }
      const L2 = trip.legs[trip.i]; along(L2.pts, L2.cum, trip.d, tmp); along(L2.pts, L2.cum, Math.min(L2.len, trip.d + 0.4), tmp2);
      const dx = tmp2.x - tmp.x, dz = tmp2.z - tmp.z; if (dx * dx + dz * dz > 1e-6) carry.yaw = Math.atan2(dx, dz);
      carry.x = tmp.x; carry.z = tmp.z; carry.y = tmp.y; carry.walk = L2.walk;
      trip.cab.visible = L2.basket; if (L2.basket) { trip.cab.position.set(tmp.x, tmp.y + HANG, tmp.z); trip.cab.rotation.set(0, carry.yaw, Math.sin(tt * 1.5) * 0.04); }
      K.state.path = []; } }
  return { interact, update, close, get open() { return !!here; }, get carry() { return trip ? carry : null; }, stops };
}
