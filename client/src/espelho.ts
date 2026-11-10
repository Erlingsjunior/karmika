/* 09/11 (Erling: "não vejo o drone nem o robô de defesa do meu parceiro, nem as flechas dele e os ataques — preciso ver tudo que acontece
   com a minha party"; "as minhas magias, pets e ajudantes ficam sem transparência para mim; dos aliados ficam semi-transparentes;
   de quem não é aliado eu só vejo pets e montarias").
   O ESPELHO: tudo o que o MEU herói solta no mundo pelo gameplay (drones, robô de escudo, torres, bichos, flechas, raios, muralhas,
   faíscas) é copiado como IMAGEM para os outros da sala — sem lógica, sem dano: só o desenho, a posição e o fim.
   - companheiros de grupo: veem tudo, meio transparente;
   - quem não é do grupo: vê só os bichos (pets). As montarias já vão pelo próprio herói.
   Pela rede: 'x:fxp' (só o grupo: objetos e faíscas) e 'x:fxa' (todos: só os bichos). */
import * as THREE from 'three';

type PartOpts = Parameters<import('./fx3d').Particles['spawn']>[3];
interface Out { id: number; o: THREE.Object3D; pet: boolean; ann: number; h: string; json: unknown | null; skip: boolean; last: string; born: number }
interface Ghost { o: THREE.Object3D; p: THREE.Vector3; r: THREE.Euler; s: THREE.Vector3; seen: number; ttl: number; from: number }
export interface MirrorNet {
  x(t: string, data: object): void; onX(t: string, f: (from: number, m: Record<string, unknown>) => void): void;
  readonly state: string; readonly party: { members: number[] } | null; readonly myId: number;
  remotes(): { id: number; zn: string; pos: THREE.Vector3 }[];
}

let nextId = 1, on = false;
const outs: Out[] = [];
let parts: unknown[] = [];

/** o gameplay chama isto para cada coisa que o herói põe no mundo (fxAdd, projéteis, drones) */
export function mirrorTrack(o: THREE.Object3D, pet = false) {
  if (!on || (o as THREE.Light).isLight) return;
  outs.push({ id: nextId++, o, pet: pet || !!o.userData.pet, ann: -1e9, h: '', json: null, skip: false, last: '', born: performance.now() });
  if (outs.length > 400) outs.splice(0, outs.length - 400);
}
/** faíscas do herói (o gameplay chama junto com cada particles.spawn) */
export function mirrorPart(x: number, y: number, z: number, p: PartOpts) {
  if (!on || !partyOn) return; if (parts.length >= 160) return;
  const q: Record<string, number> = { x: r2(x), y: r2(y), z: r2(z) }; for (const k in p) { const v = (p as Record<string, number>)[k]; if (typeof v === 'number') q[k] = k === 'c0' || k === 'c1' ? v : r2(v); }
  parts.push(q);
}
const r2 = (v: number) => Math.round(v * 100) / 100;
let partyOn = false;

/* geometrias que foram giradas/movidas depois de criadas (rotateX, translate…): o toJSON delas só guarda os parâmetros e perderia o giro */
const bent = new WeakMap<THREE.BufferGeometry, boolean>();
function isBent(g: THREE.BufferGeometry): boolean {
  const c = bent.get(g); if (c !== undefined) return c;
  let b = true; const P = (g as unknown as { parameters?: Record<string, unknown> }).parameters;
  if (P) { try { const G = g.constructor as new (...a: unknown[]) => THREE.BufferGeometry; const f = new G(...Object.values(P)); const a = (f.getAttribute('position')?.array ?? []) as ArrayLike<number>, o = (g.getAttribute('position')?.array ?? []) as ArrayLike<number>;
    b = a.length !== o.length; if (!b) for (let i = 0; i < Math.min(a.length, 60); i++) if (Math.abs(a[i] - o[i]) > 1e-4) { b = true; break; } f.dispose(); } catch { b = true; } }
  else b = true;
  bent.set(g, b); return b;
}
function serialize(o: THREE.Object3D): unknown | null {
  try {
    const j = o.toJSON() as { geometries?: { uuid: string }[] };
    if (j.geometries) { const byId = new Map<string, THREE.BufferGeometry>(); o.traverse((c) => { const g = (c as THREE.Mesh).geometry; if (g) byId.set(g.uuid, g); });
      j.geometries = j.geometries.map((e) => { const g = byId.get(e.uuid); if (!g || !(g as unknown as { parameters?: unknown }).parameters || !isBent(g)) return e; const p = new THREE.BufferGeometry().copy(g); const out = p.toJSON() as { uuid: string }; out.uuid = e.uuid; p.dispose(); return out; }); }
    return j;
  } catch { return null; }
}
function hashOf(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + s.length.toString(36); }

/* ---------------- quem recebe ---------------- */
const loader = new THREE.ObjectLoader();
const protos = new Map<string, THREE.Object3D>(); // hash:modo → protótipo (materiais já transparentes)
const rawJ = new Map<string, unknown>();
const ghosts = new Map<string, Ghost>();
let scene: THREE.Scene | null = null, particles: import('./fx3d').Particles | null = null, NET: MirrorNet | null = null;

function protoOf(h: string, ally: boolean): THREE.Object3D | null {
  const key = h + (ally ? ':a' : ':o'); const c = protos.get(key); if (c) return c; const j = rawJ.get(h); if (!j) return null;
  let o: THREE.Object3D; try { o = loader.parse(j as never); } catch { return null; }
  const done = new Set<THREE.Material>();
  o.traverse((m) => { m.castShadow = false; m.receiveShadow = false; const mm = (m as THREE.Mesh).material; if (!mm) return;
    for (const mat of Array.isArray(mm) ? mm : [mm]) { if (done.has(mat)) continue; done.add(mat); if (ally) { mat.transparent = true; mat.opacity *= 0.5; mat.depthWrite = false; } mat.needsUpdate = true; } });
  o.userData.ghost = true; protos.set(key, o); return o;
}
const inParty = (id: number) => !!NET?.party && NET.party.members.includes(id) && id !== NET.myId;

function recv(from: number, m: Record<string, unknown>, group: boolean) {
  if (!scene || !NET) return; const ally = inParty(from); if (group && !ally) return; // servidor antigo manda para todos: aqui eu filtro
  const r = NET.remotes().find((q) => q.id === from); const myZn = mirrorZone(); if (!r || r.zn !== myZn) return;
  const now = performance.now();
  for (const [h, j] of (m.j as [string, unknown][] | undefined) ?? []) if (!rawJ.has(h)) { rawJ.set(h, j); if (rawJ.size > 300) rawJ.delete(rawJ.keys().next().value as string); }
  for (const e of (m.o as (number | string)[][] | undefined) ?? []) { // [id, hash, x,y,z, rx,ry,rz, sx,sy,sz, vis, ttl?]
    const [id, h, x, y, z, rx, ry, rz, sx, sy, sz, vis, ttl] = e as [number, string, number, number, number, number, number, number, number, number, number, number, number?];
    const key = from + ':' + id; let g = ghosts.get(key);
    if (!g) { const P = protoOf(h, ally); if (!P) continue; const o = P.clone(true); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.set(sx, sy, sz); scene.add(o);
      g = { o, p: new THREE.Vector3(x, y, z), r: new THREE.Euler(rx, ry, rz), s: new THREE.Vector3(sx, sy, sz), seen: now, ttl: 0, from }; ghosts.set(key, g); }
    g.p.set(x, y, z); g.r.set(rx, ry, rz); g.s.set(sx, sy, sz); g.seen = now; g.o.visible = !!vis; if (ttl) g.ttl = now + ttl * 1000;
  }
  for (const id of (m.x as number[] | undefined) ?? []) { const key = from + ':' + id, g = ghosts.get(key); if (g) { g.o.parent?.remove(g.o); ghosts.delete(key); } }
  if (particles && ally) for (const q of (m.p as Record<string, number>[] | undefined) ?? []) { const { x, y, z, ...o } = q; particles.spawn(x, y, z, { ...(o as PartOpts), a: (o.a ?? 1) * 0.5 }); }
}
let zoneFn: () => string = () => 'world';
const mirrorZone = () => zoneFn();

/** liga o espelho à sala (rede.ts) */
export function initMirror(sc: THREE.Scene, pt: import('./fx3d').Particles, net: MirrorNet, zone: () => string) {
  scene = sc; particles = pt; NET = net; zoneFn = zone; on = true;
  net.onX('x:fxp', (f, m) => recv(f, m, true)); net.onX('x:fxa', (f, m) => recv(f, m, false));
  setInterval(flush, 100);
}

/* ---------------- quem manda ---------------- */
function flush() {
  if (!NET) return; const now = performance.now();
  const live = NET.state === 'on' && NET.remotes().length > 0; partyOn = live && !!NET.party && NET.party.members.length > 1;
  if (!live) { outs.length = 0; parts = []; return; }
  const P = { o: [] as unknown[], j: [] as [string, unknown][], x: [] as number[], p: parts }, A = { o: [] as unknown[], j: [] as [string, unknown][], x: [] as number[] };
  parts = []; let budget = 60, bytes = 0;
  for (let i = outs.length - 1; i >= 0; i--) { const e = outs[i], B = e.pet ? A : P; if (!e.pet && !partyOn) { if (!(e.o.parent as THREE.Scene | null)?.isScene) outs.splice(i, 1); continue; }
    const gone = !(e.o.parent as THREE.Scene | null)?.isScene; // flecha cravada num bicho (filha dele) também sai
    if (gone) { if (e.ann > 0) B.x.push(e.id); else if (now - e.born < 400 && !e.skip) { announce(e, B, now, 0.25); } outs.splice(i, 1); continue; }
    if (e.skip || budget <= 0) continue;
    if (now - e.ann > 4000) { if (!announce(e, B, now)) continue; budget--; bytes += 1; continue; }
    const o = e.o, k = row(e, o); if (k !== e.last) { e.last = k; B.o.push(rowArr(e, o)); budget--; }
  }
  void bytes;
  if (P.o.length || P.x.length || P.p.length) NET.x('x:fxp', P);
  if (A.o.length || A.x.length) NET.x('x:fxa', A);
}
const sent = new Map<string, number>();
function announce(e: Out, B: { o: unknown[]; j: [string, unknown][] }, now: number, ttl = 0): boolean {
  if (!e.h) { const j = serialize(e.o); if (!j) { e.skip = true; return false; } const s = JSON.stringify(j); if (s.length > 160_000) { e.skip = true; return false; } e.h = hashOf(s); e.json = j; }
  if ((sent.get(e.h) ?? -1e9) < now - 4000) { B.j.push([e.h, e.json]); sent.set(e.h, now); if (sent.size > 500) sent.delete(sent.keys().next().value as string); }
  e.ann = now; const r = rowArr(e, e.o); if (ttl) r.push(ttl); B.o.push(r); e.last = row(e, e.o); return true;
}
function rowArr(e: Out, o: THREE.Object3D): (number | string)[] { return [e.id, e.h, r2(o.position.x), r2(o.position.y), r2(o.position.z), r2(o.rotation.x), r2(o.rotation.y), r2(o.rotation.z), r2(o.scale.x), r2(o.scale.y), r2(o.scale.z), o.visible ? 1 : 0]; }
const row = (e: Out, o: THREE.Object3D) => rowArr(e, o).join(',');

/** a cada quadro (main): os fantasmas deslizam até a última posição e somem se o dono parar de mandar */
export function mirrorUpdate(dt: number) {
  if (!ghosts.size) return; const now = performance.now(), k = Math.min(1, dt * 14), myZn = mirrorZone();
  for (const [key, g] of ghosts) {
    const r = NET?.remotes().find((q) => q.id === g.from);
    if (!r || r.zn !== myZn || now - g.seen > 6000 || (g.ttl && now > g.ttl)) { g.o.parent?.remove(g.o); ghosts.delete(key); continue; }
    if (g.o.position.distanceTo(g.p) > 8) g.o.position.copy(g.p); else g.o.position.lerp(g.p, k);
    g.o.rotation.set(g.o.rotation.x + (g.r.x - g.o.rotation.x) * k, g.o.rotation.y + angD(g.o.rotation.y, g.r.y) * k, g.o.rotation.z + (g.r.z - g.o.rotation.z) * k); g.o.scale.lerp(g.s, k);
  }
}
const angD = (a: number, b: number) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
