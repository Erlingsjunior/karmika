/* Cache do mundo (22/10/2026): gerar o mundo de 840×840 é a parte mais pesada da abertura (vários segundos de CPU).
   Como o mundo é sempre o mesmo (mesma semente), a primeira abertura gera e guarda no IndexedDB; as próximas só leem.
   A assinatura é o texto do próprio world.ts: qualquer mudança no gerador invalida o cache sozinha. */
import worldSrc from './world.ts?raw';
import { buildCity, worldState, restoreWorldState, type World } from './world';

const DB = 'karmika-cache', STORE = 'kv', KEY = 'world';
function sig(): string { let h = 2166136261; for (let i = 0; i < worldSrc.length; i++) { h ^= worldSrc.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + ':' + worldSrc.length; }
function db(): Promise<IDBDatabase> { return new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function get<T>(k: string): Promise<T | undefined> { const d = await db(); return new Promise((res, rej) => { const q = d.transaction(STORE).objectStore(STORE).get(k); q.onsuccess = () => res(q.result as T); q.onerror = () => rej(q.error); }); }
async function put(k: string, v: unknown) { const d = await db(); return new Promise<void>((res, rej) => { const t = d.transaction(STORE, 'readwrite'); t.objectStore(STORE).put(v, k); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); }

/** grades de texto (tiles, biomas) viram bytes + dicionário: guardar e ler fica muito mais leve */
function packGrid(g: string[][]) { const dict: string[] = [], idx = new Map<string, number>(), H = g.length, W = g[0]?.length ?? 0, a = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) { const row = g[y]; for (let x = 0; x < W; x++) { const v = row[x]; let i = idx.get(v); if (i === undefined) { i = dict.length; dict.push(v); idx.set(v, i); } a[y * W + x] = i; } }
  return { dict, W, H, a }; }
function unpackGrid(p: { dict: string[]; W: number; H: number; a: Uint8Array }) { const out: string[][] = new Array(p.H); for (let y = 0; y < p.H; y++) { const row: string[] = new Array(p.W); for (let x = 0; x < p.W; x++) row[x] = p.dict[p.a[y * p.W + x]]; out[y] = row; } return out; }

type Packed = { sig: string; map: ReturnType<typeof packGrid>; biome: ReturnType<typeof packGrid>; rest: Omit<World, 'map' | 'biome'>; state: ReturnType<typeof worldState> };

export async function loadWorld(): Promise<World> {
  const s = sig();
  try {
    const c = await get<Packed>(KEY);
    if (c && c.sig === s) { const w = { ...c.rest, map: unpackGrid(c.map), biome: unpackGrid(c.biome) } as World; restoreWorldState(c.state, w); return w; }
  } catch (e) { console.warn('[mundo] cache ilegível, gerando de novo', e); }
  const w = buildCity();
  try { const { map, biome, ...rest } = w; const pk: Packed = { sig: s, map: packGrid(map as string[][]), biome: packGrid(biome as string[][]), rest: JSON.parse(JSON.stringify(rest)), state: JSON.parse(JSON.stringify(worldState())) }; put(KEY, pk).catch((e) => console.warn('[mundo] não deu para guardar o cache', e)); } catch (e) { console.warn('[mundo] cache', e); }
  return w;
}

/** tabela de números derivada do mundo (ex.: relevo do mapa grande): guardada junto, com a mesma assinatura */
export async function cachedArray(key: string, make: () => Float32Array): Promise<Float32Array> {
  const s = sig();
  try { const c = await get<{ sig: string; a: Float32Array }>(key); if (c && c.sig === s && c.a instanceof Float32Array) return c.a; } catch { /* gera */ }
  const a = make(); put(key, { sig: s, a }).catch(() => { /* sem cache, tudo bem */ }); return a;
}
