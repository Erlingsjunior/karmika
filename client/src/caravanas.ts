import { artMesh, artGeo, artMat } from './arte3d';
/* ---------- A Companhia das Caravanas de Latão (Erling, 24/10: "paladinos, vampiros e tecnocratas com caravanas, resgates e escoltas").
   A Academia de Ylva financia a pesquisa VENDENDO, e quem leva a mercadoria é a Companhia: carroças a vapor de latão e
   carvalho que andam de verdade pelas estradas, com um cocheiro e dois guardas a pé.
   - Caravanas do mundo: rotas fixas, horário fixo (o relógio de verdade decide onde cada uma está: todo mundo vê a mesma).
   - Caravana atacada: de tempos em tempos uma delas é emboscada num ponto da estrada e aparece no mapa. Quem chega primeiro
     decide: salva (Luz) ou, se a alma já pende para a sombra, saqueia a carga (Sombra). A loja da Companhia sente as duas coisas.
   - Escolta (missão): uma caravana só sua espera no ponto de saída, anda quando você está perto, para quando você se afasta,
     sofre emboscadas no caminho e pode cair. Se cair, volta ao ponto de partida e tenta de novo.
   - Resgate (missão): uma caravana tombada, cercada, num ponto da estrada. Limpe, examine os destroços.
   Nada aqui é caixote: carroceria de tábua curva, caldeira de latão com cintas e rebites, rodas de raio, lona em arcos,
   chaminé que solta fumaça, lanterna que acende à noite. ---------- */
import * as THREE from 'three';
import { std, plankTex, woodTex } from './toon3d';
import { createCharacter, type Hero3D } from './characters';
import { attachSkin } from './skin3d';
import { fine } from './dual3d';
import { buildHorse, type Horse4 } from './werewolf3d';
import { buildArtHorse, type HorseArt } from './montarias3d';
/** 03/11 (Erling: "coloca os cavalos novos que trouxemos… mantenha a relação de proporções"): a parelha usa os cavalos do Herik (2 m até a orelha,
 *  2,5 m de comprimento, o mesmo das montarias); o cavalo desenhado só entra se o modelo não carregou */
function teamHorse(art: HorseArt, tint: number | undefined, fb: Parameters<typeof buildHorse>[0]): Horse4 { return (buildArtHorse(art, tint) as Horse4 | null) ?? buildHorse(fb); }
import type { EnemyType } from './world';

const T = 2;
type P2 = { x: number; z: number };
export interface RouteDef { id: string; name: string; stops: string[]; lvl: number; foes: EnemyType[]; foeName: string; /** quem leva a carga: a Companhia (vapor, tecnocratas), os anões (carroça de minério puxada a cavalo) ou mercadores humanos (carroça coberta) */ kind?: 'steam' | 'dwarf' | 'human'; /** 28/10 (Erling): a bandeira que diz QUAL carroça é — decide o modelo, a tripulação e a loja. Nunca deduzir de outra coisa */ carroca?: 'carrocaAVapor' | 'carrocaDosAnoes'; /** nome de cada bicho da emboscada */ names?: Partial<Record<EnemyType, string>>; night?: boolean; /** onde o comboio sai (texto) */ from: string }
export interface Route extends RouteDef { pts: P2[]; cum: number[]; len: number }

/** as rotas da Companhia (os nomes são as vilas por onde a estrada passa) */
export const ROUTES: RouteDef[] = [
  { id: 'ak-hr', kind: 'steam', names: { wolf: 'Lobo da Estrada', coyote: 'Coiote da Estrada' },  name: 'Askavik → Hrafnhöfn', stops: ['Askavik', 'Hrafnhöfn'], lvl: 31, foes: ['wolf', 'wolf', 'coyote'], foeName: 'Lobo da Estrada', from: 'portão leste de Askavik' },
  { id: 'ak-cv', kind: 'steam', names: { ghoul: 'Carniçal da Estrada', bat: 'Morcego da Corte' },  name: 'Rota Noturna de Corvoscuro', stops: ['Askavik', 'Hrafnhöfn', 'Corvoscuro'], lvl: 32, foes: ['ghoul', 'bat', 'bat'], foeName: 'Carniçal da Estrada', night: true, from: 'portão leste de Askavik' },
  { id: 'au-ak', kind: 'steam', names: { zombie: 'Morto Erguido', skeleton: 'Ossada Desfiada' },  name: 'Austrvik → Askavik (a Catedral)', stops: ['Austrvik', 'Eikvik', 'Lundr', 'Askavik'], lvl: 35, foes: ['zombie', 'skeleton', 'skeleton'], foeName: 'Morto Erguido', from: 'Austrvik, ao pé da Abadia' },
  { id: 'ak-au', kind: 'steam', names: { werewolf: 'Lobisomem Saqueador', ghoul: 'Carniçal Saqueador', skeleton: 'Ossada Desfiada' },  name: 'A Grande Rota (Askavik → Austrvik)', stops: ['Askavik', 'Lundr', 'Eikvik', 'Austrvik'], lvl: 39, foes: ['werewolf', 'ghoul', 'skeleton'], foeName: 'Saqueador da Grande Rota', from: 'portão sul de Askavik' },
  { id: 'kf-bf', kind: 'steam', names: { frostwolf: 'Lobo do Passo', imp: 'Diabrete da Fenda' },  name: 'Passo de Midvangr', stops: ['Kaldrfoss', 'Midvangr', 'Brasaforja'], lvl: 34, foes: ['frostwolf', 'frostwolf', 'imp'], foeName: 'Lobo do Passo', from: 'Kaldrfoss' },
  { id: 'pc-vp', kind: 'steam', names: { puglin: 'Saqueador da Costa', boar: 'Javali da Costa' },  name: 'Porto Caldeira → Vaporeira', stops: ['Porto Caldeira', 'Vaporeira'], lvl: 25, foes: ['puglin', 'puglin', 'boar'], foeName: 'Saqueador da Costa', from: 'Porto Caldeira' },
  /* 26/10 (Erling: "não tenho visto muitas caravanas; caravanas de tecnocratas e de anões também, com suas carroças") */
  { id: 'bf-ak', kind: 'dwarf', names: { frostwolf: 'Lobo do Passo', imp: 'Diabrete da Fenda' }, name: 'Minério de Brasaforja (→ Askavik)', stops: ['Brasaforja', 'Midvangr', 'Kaldrfoss', 'Askavik'], lvl: 33, foes: ['frostwolf', 'imp', 'frostwolf'], foeName: 'Lobo do Passo', from: 'portão de Brasaforja' },
  { id: 'bf-cz', kind: 'dwarf', names: { imp: 'Diabrete das Cinzas', puglin: 'Puglin das Cinzas' }, name: 'Brasaforja → Cinzalto', stops: ['Brasaforja', 'Cinzalto'], lvl: 30, foes: ['imp', 'puglin', 'imp'], foeName: 'Diabrete das Cinzas', from: 'portão de Brasaforja' },
  { id: 'uf-bf', kind: 'dwarf', names: { wolf: 'Lobo de Ulfheim', boar: 'Javali de Ulfheim' }, name: 'Ulfheim → Brasaforja', stops: ['Ulfheim', 'Brasaforja'], lvl: 28, foes: ['wolf', 'boar', 'wolf'], foeName: 'Lobo de Ulfheim', from: 'Ulfheim' },
  { id: 'vp-bk', kind: 'steam', names: { puglin: 'Saqueador do Pântano', boar: 'Javali do Pântano' }, name: 'Vaporeira → Brekkuvik', stops: ['Vaporeira', 'Brekkuvik'], lvl: 24, foes: ['puglin', 'boar', 'puglin'], foeName: 'Saqueador do Pântano', from: 'Vaporeira' },
  { id: 'km-lu', kind: 'human', names: { wolf: 'Lobo da Estrada', coyote: 'Coiote da Estrada' }, name: 'Karmika → Lundr', stops: ['Karmika', 'Lundr'], lvl: 6, foes: ['coyote', 'wolf', 'coyote'], foeName: 'Coiote da Estrada', from: 'Karmika' },
  { id: 'km-ve', kind: 'human', names: { boar: 'Javali da Estrada', coyote: 'Coiote da Estrada' }, name: 'Karmika → Vestheim', stops: ['Karmika', 'Vestheim'], lvl: 7, foes: ['boar', 'coyote', 'coyote'], foeName: 'Javali da Estrada', from: 'Karmika' },
  { id: 'km-su', kind: 'human', names: { wolf: 'Lobo da Estrada', boar: 'Javali da Estrada' }, name: 'Karmika → Sudrholt', stops: ['Karmika', 'Sudrholt'], lvl: 8, foes: ['wolf', 'boar', 'wolf'], foeName: 'Lobo da Estrada', from: 'Karmika' },
  { id: 'lu-ak', kind: 'human', names: { wolf: 'Lobo da Estrada', coyote: 'Coiote da Estrada' }, name: 'Lundr → Askavik', stops: ['Lundr', 'Askavik'], lvl: 14, foes: ['wolf', 'wolf', 'coyote'], foeName: 'Lobo da Estrada', from: 'Lundr' },
  { id: 'lm-bk', kind: 'human', names: { puglin: 'Salteador da Lagoa', wolf: 'Lobo da Lagoa' }, name: 'Lumenhal → Brekkuvik', stops: ['Lumenhal', 'Myrbakki', 'Brekkuvik'], lvl: 20, foes: ['puglin', 'wolf', 'puglin'], foeName: 'Salteador da Lagoa', from: 'Lumenhal' },
  { id: 'lm-ve', kind: 'human', names: { puglin: 'Salteador da Lagoa', boar: 'Javali do Vale' }, name: 'Lumenhal → Vestheim', stops: ['Lumenhal', 'Vatnaholt', 'Vestheim'], lvl: 18, foes: ['puglin', 'boar', 'puglin'], foeName: 'Salteador da Lagoa', from: 'Lumenhal' },
];
/* toda rota sai daqui com a bandeira da carroça: vapor = Companhia de Latão (tecnocratas); anã e humana = a carroça dos anões (carnes, cervejas, peças, festas) */
for (const r of ROUTES) { r.kind ??= 'steam'; r.carroca = r.kind === 'steam' ? 'carrocaAVapor' : 'carrocaDosAnoes'; }
/** as que andam sozinhas pelo mundo (as outras só existem nas missões) */
const AMBIENT = ['ak-cv', 'ak-au', 'kf-bf', 'pc-vp', 'ak-hr', 'bf-ak', 'bf-cz', 'uf-bf', 'vp-bk', 'km-lu', 'km-ve', 'km-su', 'lu-ak', 'lm-bk', 'lm-ve'];

/** junta os trechos de estrada (world.roadLinks) na ordem das paradas */
export function buildRoutes(roadPaths: { x: number; y: number }[][], links: { a: string; b: string; i: number }[]): Map<string, Route> {
  const out = new Map<string, Route>();
  for (const R of ROUTES) {
    const pts: P2[] = []; let ok = true;
    for (let s = 0; s < R.stops.length - 1; s++) {
      const a = R.stops[s], b = R.stops[s + 1];
      const l = links.find((q) => q.a === a && q.b === b) ?? links.find((q) => q.a === b && q.b === a); if (!l) { ok = false; break; }
      let seg = roadPaths[l.i].map((q) => ({ x: (q.x + 0.5) * T, z: (q.y + 0.5) * T })); if (l.a !== a) seg = seg.reverse();
      if (pts.length) { const last = pts[pts.length - 1]; if (Math.hypot(seg[0].x - last.x, seg[0].z - last.z) < 3) seg = seg.slice(1); }
      pts.push(...seg);
    }
    if (!ok || pts.length < 4) continue;
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
    out.set(R.id, { ...R, pts, cum, len: cum[cum.length - 1] });
  }
  return out;
}
/** ponto e direção a s metros do começo */
function at(r: Route, s: number) { s = Math.max(0, Math.min(r.len - 0.01, s)); let lo = 0, hi = r.cum.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (r.cum[m] <= s) lo = m; else hi = m; }
  const a = r.pts[lo], b = r.pts[lo + 1] ?? a, L = r.cum[lo + 1] - r.cum[lo] || 1, k = (s - r.cum[lo]) / L; return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, yaw: Math.atan2(b.x - a.x, b.z - a.z) }; }

/* ================= o modelo: carroça a vapor da Companhia ================= */
interface Wagon { /** caixa que barra o herói (m, no espaço da carroça: meia largura, meia profundidade, centro em z) */ box?: { hw: number; hl: number; zc: number }; /** banco do cocheiro (m, no espaço da carroça) */ seat?: THREE.Vector3; root: THREE.Group; body: THREE.Group; wheels: { m: THREE.Object3D; r: number }[]; stack: THREE.Object3D; lamp: THREE.Sprite; flag: THREE.Mesh; fallen: boolean; hpBar: THREE.Group; hpFill: THREE.Mesh; /** carroça puxada a cavalo (anões e mercadores): o cavalo anda na frente */ horse?: Horse4; kind: 'steam' | 'dwarf' | 'human' }
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!, gr = g.createRadialGradient(32, 32, 1, 32, 32, 31); gr.addColorStop(0, 'rgba(255,230,160,1)'); gr.addColorStop(0.3, 'rgba(255,170,60,.55)'); gr.addColorStop(1, 'rgba(255,120,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
/** brasão da Companhia: engrenagem de latão sobre carvalho */
const crestTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!; g.fillStyle = '#5a1e14'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#7a2a1c'; g.fillRect(0, 44, 64, 20);
  g.translate(32, 28); g.fillStyle = '#e0b048'; for (let i = 0; i < 10; i++) { g.rotate(Math.PI / 5); g.fillRect(-3, -17, 6, 6); } g.beginPath(); g.arc(0, 0, 13, 0, 6.283); g.fill(); g.fillStyle = '#5a1e14'; g.beginPath(); g.arc(0, 0, 5, 0, 6.283); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; return t; })();
let MATS: Record<string, THREE.Material> | null = null;
function mats() { if (MATS) return MATS;
  MATS = { oak: std(0xffffff, { map: plankTex(0x7a5232) }), dark: std(0xffffff, { map: woodTex(0x3a2414) }), brass: std(0xd9a441, { emissive: new THREE.Color(0x3a2408), emissiveIntensity: 0.25 }), brassD: std(0x9a6a24), iron: std(0x34363c), canvas: std(0xd8c8a0), canvasD: std(0xb8a47c), red: std(0x8a2a1c), coal: std(0x1a1614), crest: std(0xffffff, { map: crestTex, side: THREE.DoubleSide }), glass: new THREE.MeshBasicMaterial({ color: 0xffd890 }) };
  return MATS; }
function wheel(r: number, w: number): THREE.Group {
  const M = mats(), g = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.055, 6, 22), M.dark); rim.scale.z = w / 0.11; g.add(rim);
  const tire = new THREE.Mesh(new THREE.TorusGeometry(r + 0.03, 0.03, 4, 22), M.iron); g.add(tire);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.2, r * 0.2, w * 1.3, 10).rotateX(Math.PI / 2), M.brass); g.add(hub);
  for (let i = 0; i < 10; i++) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, r * 0.85, 5), M.dark); const a = i / 10 * Math.PI * 2; sp.position.set(Math.sin(a) * r * 0.5, Math.cos(a) * r * 0.5, 0); sp.rotation.z = -a; g.add(sp); }
  return g;
}
/** 03/11 (Erling: "as rodas precisam girar quando anda"): o modelo do Herik vem numa malha só. Aqui ele é separado em pedaços ligados
 *  (componentes); os que tocam o chão com cara de disco são as rodas (com o cubo e os raios que estão dentro delas). O modelo também vinha
 *  girado uns graus na base (a carroça andava de lado em relação aos cavalos): o eixo das rodas diz o ângulo certo, e tudo é endireitado e
 *  centrado entre as rodas. */
interface ArtSplit { body: THREE.BufferGeometry; wheels: { geo: THREE.BufferGeometry; c: THREE.Vector3; r: number }[]; tx: (v: THREE.Vector3) => THREE.Vector3; box: THREE.Box3 }
const splitC = new Map<string, ArtSplit | null>();
function splitArt(id: string): ArtSplit | null {
  if (splitC.has(id)) return splitC.get(id)!; const G0 = artGeo(id); if (!G0) return null;
  const G = G0.index ? G0.toNonIndexed() : G0.clone(); const P = G.attributes.position as THREE.BufferAttribute, nT = P.count / 3;
  const par = new Int32Array(nT).map((_, i) => i), f = (i: number) => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
  const owner = new Map<string, number>(); for (let v = 0; v < P.count; v++) { const key = `${Math.round(P.getX(v) * 500)},${Math.round(P.getY(v) * 500)},${Math.round(P.getZ(v) * 500)}`, t = (v / 3) | 0, o = owner.get(key); if (o === undefined) owner.set(key, t); else { const a = f(o), b = f(t); if (a !== b) par[b] = a; } }
  const comps = new Map<number, { tris: number[]; bb: THREE.Box3 }>(), tmp = new THREE.Vector3();
  for (let t = 0; t < nT; t++) { const r = f(t); let c = comps.get(r); if (!c) comps.set(r, (c = { tris: [], bb: new THREE.Box3() })); c.tris.push(t); for (let k = 0; k < 3; k++) c.bb.expandByPoint(tmp.fromBufferAttribute(P, t * 3 + k)); }
  const all = new THREE.Box3().setFromBufferAttribute(P), Hh = all.max.y - all.min.y;
  const isWheel = (c: { tris: number[]; bb: THREE.Box3 }) => { const sz = c.bb.getSize(new THREE.Vector3()); return c.tris.length >= 60 && c.bb.min.y < all.min.y + 0.08 && sz.y > 0.25 && sz.y < Hh * 0.55 && Math.max(sz.x, sz.z) < sz.y * 1.25; };
  const wl = [...comps.values()].filter(isWheel); if (wl.length < 2) { splitC.set(id, null); return null; }
  const wheelOf = new Map<number, number>(); wl.forEach((c, i) => c.tris.forEach((t) => wheelOf.set(t, i)));
  for (const c of comps.values()) { if (wl.includes(c)) continue; const cc = c.bb.getCenter(new THREE.Vector3()); const i = wl.findIndex((w) => w.bb.clone().expandByScalar(0.03).containsBox(c.bb) || w.bb.containsPoint(cc) && c.bb.getSize(tmp).length() < w.bb.getSize(new THREE.Vector3()).length() * 0.8); if (i >= 0) c.tris.forEach((t) => wheelOf.set(t, i)); }
  /* o eixo: a direção no chão em que a roda é mais fina */
  let sx = 0, sz2 = 0; for (let i = 0; i < wl.length; i++) { let best = 1e9, bt = 0; for (let a = 0; a < 180; a += 2) { const th = (a * Math.PI) / 180, cx = Math.cos(th), cz = Math.sin(th); let lo = 1e9, hi = -1e9; for (const t of wl[i].tris) for (let k = 0; k < 3; k++) { const v = t * 3 + k, d = P.getX(v) * cx + P.getZ(v) * cz; lo = Math.min(lo, d); hi = Math.max(hi, d); } if (hi - lo < best) { best = hi - lo; bt = th; } } sx += Math.cos(bt * 2); sz2 += Math.sin(bt * 2); }
  const th = Math.atan2(sz2, sx) / 2; /* eixo médio (ângulo dobrado: a direção não tem sinal) */
  const rot = new THREE.Matrix4().makeRotationY(th); /* leva o eixo das rodas para o x do modelo */
  const cen = new THREE.Vector3(); wl.forEach((c) => cen.add(c.bb.getCenter(new THREE.Vector3()).applyMatrix4(rot))); cen.divideScalar(wl.length); cen.y = 0;
  const M = new THREE.Matrix4().makeTranslation(-cen.x, -all.min.y, -cen.z).multiply(rot), tx = (v: THREE.Vector3) => v.clone().applyMatrix4(M);
  const pick = (want: (t: number) => boolean) => { const idx: number[] = []; for (let t = 0; t < nT; t++) if (want(t)) idx.push(t); const g = new THREE.BufferGeometry(); for (const n of Object.keys(G.attributes)) { const A = G.attributes[n] as THREE.BufferAttribute, it = A.itemSize, arr = new Float32Array(idx.length * 3 * it); idx.forEach((t, j) => { for (let k = 0; k < 3 * it; k++) arr[j * 3 * it + k] = A.array[t * 3 * it + k] as number; }); g.setAttribute(n, new THREE.BufferAttribute(arr, it)); } g.applyMatrix4(M); return g; };
  const body = pick((t) => !wheelOf.has(t)); body.computeBoundingBox();
  const wheels = wl.map((_, i) => { const g = pick((t) => wheelOf.get(t) === i); g.computeBoundingBox(); const c = g.boundingBox!.getCenter(new THREE.Vector3()), r = (g.boundingBox!.max.y - g.boundingBox!.min.y) / 2; g.translate(-c.x, -c.y, -c.z); return { geo: g, c, r }; });
  const box = body.boundingBox!.clone(); for (const q of wheels) box.expandByPoint(q.c.clone().addScalar(q.r)).expandByPoint(q.c.clone().subScalar(q.r));
  const out = { body, wheels, tx, box }; splitC.set(id, out); return out;
}
/** 03/11: troca a carroceria desenhada pelo modelo do Herik (rodas, cavalos, varais, bandeira e lanterna continuam). push = quanto os
 *  cavalos e varais andam para a frente (a carroça grande não pode engolir a parelha) */
function artBody(w: Wagon, id: string, keep: (o: THREE.Object3D) => boolean, k = 1.15, flip = false, push = 0) {
  const S = splitArt(id); const m = S ? null : artMesh(id); if (!S && !m) return w;
  w.body.traverse((o) => { if ((o as THREE.Mesh).isMesh && !keep(o)) o.visible = false; });
  if (push < 0 && S) { const b = S.box, front = (flip ? -b.min.z : b.max.z) * k; /* a frente do modelo é a ponta dos varais, com as coalheiras: a primeira parelha fica com o peito ali */
    const team = ((w.horse as (Horse4 & { team?: Horse4[] }) | undefined)?.team ?? (w.horse ? [w.horse] : [])).map((h) => h.root.position.z); push = team.length ? front - 0.75 - Math.min(...team) : Math.max(0, front + 0.2 - 1.3); }
  if (push !== 0) for (const o of [...w.body.children]) if (keep(o) || o.children.some((q) => keep(q))) o.position.z += push;
  if (!S) { m!.scale.setScalar(k); if (flip) m!.rotation.y = Math.PI; w.body.add(m!); return w; }
  const hold = new THREE.Group(); hold.scale.setScalar(k); if (flip) hold.rotation.y = Math.PI; w.body.add(hold);
  const mat = artMat(id); const bm = new THREE.Mesh(S.body, mat); bm.castShadow = bm.receiveShadow = true; hold.add(bm);
  w.wheels = S.wheels.map((q) => { const piv = new THREE.Group(); piv.position.copy(q.c); piv.rotation.y = Math.PI / 2; const spin = new THREE.Group(); piv.add(spin); const wm = new THREE.Mesh(q.geo, mat); wm.rotation.y = -Math.PI / 2; wm.castShadow = true; spin.add(wm); hold.add(piv); return { m: spin, r: q.r * k * (flip ? -1 : 1) }; });
  const b = S.box, z0 = flip ? -b.max.z : b.min.z, z1 = flip ? -b.min.z : b.max.z; w.box = { hw: Math.max(-b.min.x, b.max.x) * k, hl: ((z1 - z0) / 2) * k, zc: ((z0 + z1) / 2) * k };
  /* o cocheiro: no meio, sobre o eixo da frente, a ~45% da altura (o banco dos dois modelos fica ali) */
  { const fz = Math.max(...S.wheels.map((q) => (flip ? -q.c.z : q.c.z))) * k; w.seat = new THREE.Vector3(0, b.max.y * k * 0.45, fz); }
  w.hpBar.position.y = b.max.y * k + 0.7; return w;
}
/** onde caem os pontos do modelo original depois de endireitado (chaminé, banco) */
function artPt(id: string, v: THREE.Vector3, k: number, flip: boolean) { const S = splitArt(id); const p = S ? S.tx(v) : v.clone(); p.multiplyScalar(k); if (flip) { p.x = -p.x; p.z = -p.z; } return p; }
/** 03/11 (Erling: "não posso atravessar carroças"): as carroças do quadro, para a colisão do herói (m, mundo) */
export const WAGON_BLOCK: { x: number; z: number; yaw: number; hw: number; hl: number; zc: number }[] = [];
const isIn = (o: THREE.Object3D, p: THREE.Object3D | null | undefined) => { let q: THREE.Object3D | null = o; while (q) { if (q === p) return true; q = q.parent; } return false; };
/** de que lado fica a frente do modelo (conferido em carrocas.html) */
export const ART_FLIP = { steam: true, dwarf: true }; /* 03/11 (Erling): a de vapor andava de ré — a frente é o lado dos varais */
export function buildSteamWagon(): Wagon {
  const M = mats(), root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, p: THREE.Object3D = body) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
  // carroceria: casco de tábuas com proa e popa arredondadas (perfil extrudado com chanfro), não uma caixa
  const hull = new THREE.Shape(); const HL = 2.05, HW = 0.86; hull.moveTo(-HW, -HL + 0.35); hull.quadraticCurveTo(-HW, -HL, -HW + 0.35, -HL); hull.lineTo(HW - 0.35, -HL); hull.quadraticCurveTo(HW, -HL, HW, -HL + 0.35);
  hull.lineTo(HW, HL - 0.6); hull.quadraticCurveTo(HW, HL, 0, HL + 0.05); hull.quadraticCurveTo(-HW, HL, -HW, HL - 0.6); hull.closePath();
  const hullGeo = new THREE.ExtrudeGeometry(hull, { depth: 0.5, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.05, bevelSegments: 2, curveSegments: 10 }).rotateX(Math.PI / 2);
  { const uv = hullGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.7, uv.getY(i) * 0.7); }
  add(hullGeo, M.oak, 0, 1.25, 0);
  // friso de latão em volta do casco e o estrado
  { const pts = hull.getPoints(24).map((p) => new THREE.Vector3(p.x * 1.04, 0, p.y * 1.04)); const curve = new THREE.CatmullRomCurve3(pts, true); add(new THREE.TubeGeometry(curve, 64, 0.035, 5, true), M.brass, 0, 1.26, 0); }
  add(new THREE.CylinderGeometry(0.06, 0.06, 4.3, 6).rotateX(Math.PI / 2), M.dark, -0.5, 0.62, -0.05); add(new THREE.CylinderGeometry(0.06, 0.06, 4.3, 6).rotateX(Math.PI / 2), M.dark, 0.5, 0.62, -0.05);
  // eixos e rodas: grandes atrás (tração), menores na frente (direção)
  const wheels: Wagon['wheels'] = [];
  for (const [zz, r] of [[-1.35, 0.72], [1.25, 0.52]] as [number, number][]) { add(new THREE.CylinderGeometry(0.05, 0.05, 2.0, 6).rotateZ(Math.PI / 2), M.iron, 0, r, zz);
    for (const sx of [-1, 1]) { const w = wheel(r, 0.12), hold = new THREE.Group(); hold.position.set(sx * 0.98, r, zz); hold.rotation.y = Math.PI / 2; hold.add(w); body.add(hold); wheels.push({ m: w, r }); } } // a roda gira no próprio eixo (z local), o suporte a vira de lado
  // caldeira de latão deitada na frente, com tampa em domo, cintas e rebites
  const boiler = new THREE.Group(); boiler.position.set(0, 1.72, 1.05); body.add(boiler);
  add(new THREE.CylinderGeometry(0.52, 0.52, 1.25, 16).rotateX(Math.PI / 2), M.brass, 0, 0, 0, boiler);
  add(new THREE.SphereGeometry(0.52, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), M.brassD, 0, 0, 0.62, boiler);
  for (const zz of [-0.5, -0.1, 0.3]) add(new THREE.TorusGeometry(0.535, 0.03, 4, 20), M.brassD, 0, 0, zz, boiler);
  { const rv = new THREE.InstancedMesh(new THREE.SphereGeometry(0.025, 4, 3), M.iron as THREE.Material, 36); const q = new THREE.Object3D(); let k = 0; for (const zz of [-0.5, -0.1, 0.3]) for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; q.position.set(Math.cos(a) * 0.56, Math.sin(a) * 0.56, zz + 0.04); q.updateMatrix(); rv.setMatrixAt(k++, q.matrix); } boiler.add(rv); }
  // fornalha (boca de brasa) e manômetro
  const fire = add(new THREE.CircleGeometry(0.16, 12), new THREE.MeshBasicMaterial({ color: 0xff7a2a }), 0, -0.12, 0.83, boiler); fire.userData.fire = true;
  add(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 12).rotateX(Math.PI / 2), M.brassD, 0.3, 0.38, 0.45, boiler);
  // chaminé alargada no topo
  const stack = new THREE.Group(); stack.position.set(0, 2.15, 1.25); body.add(stack);
  add(new THREE.CylinderGeometry(0.13, 0.15, 1.0, 10), M.iron, 0, 0.45, 0, stack); add(new THREE.CylinderGeometry(0.26, 0.13, 0.3, 10), M.iron, 0, 1.05, 0, stack); add(new THREE.TorusGeometry(0.25, 0.03, 4, 14).rotateX(Math.PI / 2), M.brass, 0, 1.2, 0, stack);
  // banco do cocheiro e alavanca
  add(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6).rotateZ(Math.PI / 2), M.dark, 0, 1.88, 0.3); add(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 5), M.brass, 0.35, 1.95, 0.5).rotation.x = -0.4;
  // lona da carga: arcos de madeira e o pano esticado entre eles
  const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 2.2, 14, 1, true, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2), M.canvas); /* meia-calha deitada ao longo da carroça, arqueada para cima */ cover.position.set(0, 1.42, -0.95); cover.scale.y = 1.38; cover.castShadow = true; body.add(cover);
  cover.material = std(0xd8c8a0, { side: THREE.DoubleSide }); /* o pano é visto por dentro e por fora (material próprio, não mexe no compartilhado) */
  for (const zz of [-2.0, -1.3, -0.6, 0.1]) { const arc = add(new THREE.TorusGeometry(0.9, 0.045, 4, 14, Math.PI), M.dark, 0, 1.42, zz); arc.scale.y = 1.38; }
  { const cap = add(new THREE.CircleGeometry(0.88, 14, 0, Math.PI), M.canvasD, 0, 1.42, -2.06); cap.rotation.y = Math.PI; cap.scale.y = 1.38; } // fundo fechado
  // carga visível pela boca da lona: barris e caixas com cintas
  add(new THREE.CylinderGeometry(0.24, 0.24, 0.55, 10), M.oak, -0.42, 1.62, 0.2); add(new THREE.TorusGeometry(0.245, 0.02, 3, 12).rotateX(Math.PI / 2), M.iron, -0.42, 1.72, 0.2);
  /* prancha 35 (01/11), carroça da Companhia: armário lateral aberto com prateleiras de frascos e engenhocas, aba levantada, manômetro grande e a placa do globo pendurada atrás */
  { const cab = new THREE.Group(); cab.position.set(0.9, 1.6, -0.9); body.add(cab); const A = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => add(geo, m, x, y, z, cab);
    A(new THREE.BoxGeometry(0.06, 0.9, 1.5), M.dark, 0, 0, 0); for (const yy of [-0.35, 0.0, 0.35]) A(new THREE.BoxGeometry(0.3, 0.04, 1.5), M.oak, 0.15, yy, 0); for (const zz of [-0.75, 0.75]) A(new THREE.BoxGeometry(0.3, 0.9, 0.04), M.oak, 0.15, 0, zz);
    const flap = A(new THREE.BoxGeometry(0.04, 0.9, 1.5), M.brass, 0.42, 0.75, 0); flap.rotation.z = -1.2; // aba de latão levantada (toldo)
    const cols = [0x3ad0ff, 0xff4a4a, 0xc060ff, 0x60ff80, 0xffd040]; for (let k = 0; k < 10; k++) { const yy = k < 5 ? -0.28 : 0.07, zz = -0.6 + (k % 5) * 0.3; A(new THREE.CylinderGeometry(0.045, 0.05, 0.14, 6), new THREE.MeshBasicMaterial({ color: cols[k % 5] }), 0.17, yy + 0.03, zz); A(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 5), M.brassD, 0.17, yy + 0.13, zz); }
    for (let k = 0; k < 4; k++) { const gr = A(new THREE.TorusGeometry(0.05 + (k % 2) * 0.02, 0.018, 4, 8), k % 2 ? M.brassD : M.brass, 0.17, 0.4, -0.5 + k * 0.33); gr.rotation.x = Math.PI / 2; } }
  add(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 14).rotateX(Math.PI / 2), M.brassD, -0.3, 2.1, 1.66); add(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 14).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xe8e0c8 }), -0.3, 2.1, 1.7); add(new THREE.BoxGeometry(0.02, 0.1, 0.01), M.red, -0.27, 2.14, 1.71); // manômetro grande na frente da caldeira
  { const arm = add(new THREE.BoxGeometry(0.05, 0.05, 0.7), M.dark, -0.98, 2.3, -1.6); void arm; const sg = add(new THREE.BoxGeometry(0.04, 0.5, 0.5), M.oak, -0.98, 1.95, -1.9); void sg; add(new THREE.SphereGeometry(0.16, 10, 8), M.brass, -1.01, 1.95, -1.9); } // placa do globo pendurada
  // brasão da Companhia nos dois lados e a flâmula
  for (const sx of [-1, 1]) { const cr = add(new THREE.PlaneGeometry(0.5, 0.5), M.crest, sx * 0.93, 1.42, 0.02); cr.rotation.y = sx * Math.PI / 2; }
  add(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 5), M.dark, -0.75, 2.55, -2.0);
  const flag = add(new THREE.PlaneGeometry(0.55, 0.32, 4, 1), M.crest, -0.75, 3.05, -2.3); flag.rotation.y = Math.PI / 2;
  // lanterna na frente (acende à noite)
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), M.iron, 0.62, 2.05, 1.7); add(new THREE.BoxGeometry(0.16, 0.2, 0.16), M.glass, 0.62, 2.28, 1.7);
  const lamp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); lamp.position.set(0.62, 2.28, 1.7); lamp.scale.setScalar(1.6); body.add(lamp);
  // barra de vida (só na escolta)
  const hpBar = new THREE.Group(); hpBar.position.set(0, 3.7, 0); const bg = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.16), new THREE.MeshBasicMaterial({ color: 0x1a0e08, transparent: true, opacity: 0.8, depthTest: false })); bg.renderOrder = 30; hpBar.add(bg);
  const hpFill = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.1), new THREE.MeshBasicMaterial({ color: 0xe0b048, depthTest: false })); hpFill.renderOrder = 31; hpBar.add(hpFill); hpBar.visible = false; root.add(hpBar);
  root.traverse((o) => { o.frustumCulled = true; });
  /* 03/11 (Erling: "coloca 2 cavalos de latão na carroça a vapor"): a parelha da Companhia — os cavalos de Porto Caldeira com a pelagem de latão */
  const team: Horse4[] = []; for (const sx of [-0.66, 0.66]) { const h = teamHorse('cavalo_porto_caldeira', 0xf0b040, { coat: 0xb08a40, mane: 0x5a4a3a, barding: 0x8a6a3a }); h.root.position.set(sx, 0, 3.7); body.add(h.root); team.push(h); }
  const horse = team[0]; (horse as Horse4 & { team?: Horse4[] }).team = team;
  const W0: Wagon = { root, body, wheels, stack, lamp, flag, fallen: false, hpBar, hpFill, horse, kind: 'steam' };
  /* 03/11 (Erling: "aumenta um pouco e ela precisa soltar fumaça, é a vapor"): 45% maior, e a fumaça sai da chaminé do modelo */
  /* 03/11 (Erling: "precisam ser carroças grandes… podem ser 3 ou 4× maior"): ~3× — rodas de 1,7 m, a carroça bem mais alta que um homem */
  const KS = 1.9; if (artMesh('carroca_tecnocrata')) { (W0 as Wagon & { smokeAt?: THREE.Vector3 }).smokeAt = artPt('carroca_tecnocrata', new THREE.Vector3(-0.5, 1.9, -0.12), KS, ART_FLIP.steam).add(new THREE.Vector3(0, 0.2, 0)); lamp.position.copy(artPt('carroca_tecnocrata', new THREE.Vector3(0.3, 1.2, -1.1), KS, ART_FLIP.steam)); }
  const W1 = artBody(W0, 'carroca_tecnocrata', (o) => team.some((h) => isIn(o, (h as unknown as { root: THREE.Object3D }).root)), KS, ART_FLIP.steam, -1);
  /* 03/11 (Erling: "brilho de brasa saindo da fornalha, fogo, fumaça da chaminé não seria nada mal"): a boca da fornalha da caldeira (atrás) acende e pisca, e solta brasas */
  if (artMesh('carroca_tecnocrata')) { const fire = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff7a2a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    fire.position.copy(artPt('carroca_tecnocrata', new THREE.Vector3(0.3, 0.55, 1.5), KS, ART_FLIP.steam)); fire.scale.setScalar(1.25); fire.raycast = () => {}; body.add(fire); (W1 as Wagon & { fire?: THREE.Sprite }).fire = fire; }
  return W1;
}
/** barra de vida da carroça (igual nas três) */
function hpBarFor(): { hpBar: THREE.Group; hpFill: THREE.Mesh } {
  const hpBar = new THREE.Group(); hpBar.position.set(0, 3.2, 0); const bg = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.16), new THREE.MeshBasicMaterial({ color: 0x1a0e08, transparent: true, opacity: 0.85, depthTest: false })); bg.renderOrder = 30; hpBar.add(bg);
  const hpFill = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.1), new THREE.MeshBasicMaterial({ color: 0xe0b048, depthTest: false })); hpFill.renderOrder = 31; hpBar.add(hpFill); hpBar.visible = false; return { hpBar, hpFill };
}
/** a carroça de minério dos anões: caçamba de tábuas grossas cheia de pedra e carvão, barris de cerveja, rodas de ferro, puxada por um cavalo de carga */
export function buildOreCart(): Wagon {
  const M = mats(), root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, p: THREE.Object3D = body) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
  add(new THREE.BoxGeometry(1.7, 0.16, 3.0), M.dark, 0, 0.78, -0.2); // estrado
  for (const sx of [-1, 1]) { const w = add(new THREE.BoxGeometry(0.12, 0.75, 3.0), M.oak, sx * 0.82, 1.2, -0.2); w.rotation.z = sx * 0.1; for (const yy of [0.95, 1.35]) add(new THREE.BoxGeometry(0.04, 0.05, 3.0), M.iron, sx * 0.86, yy, -0.2); }
  add(new THREE.BoxGeometry(1.7, 0.75, 0.12), M.oak, 0, 1.2, -1.7); add(new THREE.BoxGeometry(1.7, 0.55, 0.12), M.oak, 0, 1.1, 1.3);
  /* a carga: pedras de minério com veios, carvão, dois barris */
  { const ore = std(0x6a6660), vein = std(0xd9a441, { emissive: new THREE.Color(0x3a2408), emissiveIntensity: 0.3 }), coal = M.coal; const r = (k: number) => Math.abs(Math.sin(k * 12.9898) * 43758.5453) % 1;
    for (let k = 0; k < 14; k++) { const g = new THREE.DodecahedronGeometry(0.14 + r(k) * 0.12, 0); const o = add(g, k % 4 === 0 ? coal : k % 5 === 1 ? vein : ore, -0.55 + r(k + 9) * 1.1, 1.05 + r(k + 3) * 0.25, -1.4 + r(k + 5) * 2.4); o.rotation.set(r(k) * 3, r(k + 1) * 3, 0); }
    for (const [x, z] of [[-0.45, 0.85], [0.45, 0.85]]) { add(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 10), M.oak, x, 1.2, z); add(new THREE.TorusGeometry(0.225, 0.02, 3, 12).rotateX(Math.PI / 2), M.iron, x, 1.3, z); add(new THREE.TorusGeometry(0.225, 0.02, 3, 12).rotateX(Math.PI / 2), M.iron, x, 1.1, z); } }
  const wheels: Wagon['wheels'] = [];
  for (const [zz, r] of [[-1.0, 0.62], [1.0, 0.62]] as [number, number][]) { add(new THREE.CylinderGeometry(0.05, 0.05, 1.9, 6).rotateZ(Math.PI / 2), M.iron, 0, r, zz);
    for (const sx of [-1, 1]) { const w = wheel(r, 0.12), hold = new THREE.Group(); hold.position.set(sx * 0.95, r, zz); hold.rotation.y = Math.PI / 2; hold.add(w); body.add(hold); wheels.push({ m: w, r }); } }
  add(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6).rotateZ(Math.PI / 2), M.dark, 0, 1.45, 1.1); // banco do cocheiro
  for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.035, 0.035, 2.4, 5).rotateX(Math.PI / 2), M.dark, sx * 0.55, 0.9, 2.5); // varais até o cavalo
  /* parelha dupla: minério pesa — quatro cavalos de carga, dois a dois (Erling: "lembre-se da física") */
  const team: Horse4[] = []; for (const [sx, zz] of [[-0.66, 3.4], [0.66, 3.4], [-0.66, 6.2], [0.66, 6.2]] as [number, number][]) { const i = team.length, h = teamHorse(i % 2 ? 'cavalo_porto_caldeira' : 'cavalo_jarlsheim', [undefined, 0x9a8a7a, 0xc8b8a8, undefined][i], { coat: [0x5a4030, 0x4a3426, 0x6a4a34, 0x3a2a20][i], mane: 0x201410 }); h.root.position.set(sx, 0, zz); body.add(h.root); team.push(h); }
  for (const sx of [-0.66, 0.66]) add(new THREE.CylinderGeometry(0.03, 0.03, 2.8, 5).rotateX(Math.PI / 2), M.dark, sx, 0.95, 4.8); /* tirantes entre as duas parelhas */
  add(new THREE.BoxGeometry(1.5, 0.08, 0.08), M.dark, 0, 0.95, 2.3); const horse = team[0]; (horse as Horse4 & { team?: Horse4[] }).team = team;
  /* prancha 35 (01/11), carroça mercante dos anões: telhado de lajes de pedra sobre quatro postes, balcão lateral com bandejas de joias em veludo roxo,
     estante de ferramentas no fundo, alforjes pendurados e a placa da bigorna */
  { const stoneM = std(0xffffff, { map: plankTex(0x6a6a70) }); for (const sx of [-1, 1]) for (const zz of [-1.55, 1.1]) add(new THREE.BoxGeometry(0.1, 1.3, 0.1), M.dark, sx * 0.8, 2.0, zz);
    const roof = add(new THREE.CylinderGeometry(1.0, 1.0, 3.0, 10, 1, true, -Math.PI / 2 + 0.35, Math.PI - 0.7).rotateX(-Math.PI / 2), stoneM, 0, 2.15, -0.2); roof.scale.y = 0.6; (roof.material as THREE.MeshToonMaterial).side = THREE.DoubleSide;
    const counter = add(new THREE.BoxGeometry(0.5, 0.06, 2.4), M.oak, 1.1, 1.5, -0.3); void counter; add(new THREE.BoxGeometry(0.06, 0.7, 2.4), M.oak, 0.88, 1.15, -0.3);
    for (const zz of [-1.0, -0.3, 0.4]) { add(new THREE.BoxGeometry(0.36, 0.06, 0.5), M.dark, 1.1, 1.56, zz); add(new THREE.BoxGeometry(0.3, 0.02, 0.44), std(0x6a2a7a), 1.1, 1.6, zz); for (let k = 0; k < 4; k++) add(new THREE.OctahedronGeometry(0.03, 0), new THREE.MeshBasicMaterial({ color: [0xffd040, 0x60ff80, 0x60a0ff, 0xff60a0][k] }), 1.02 + (k % 2) * 0.16, 1.64, zz - 0.14 + Math.floor(k / 2) * 0.28); }
    add(new THREE.BoxGeometry(1.6, 0.9, 0.05), M.oak, 0, 2.0, -1.72); for (let k = 0; k < 6; k++) { add(new THREE.BoxGeometry(0.03, 0.35, 0.03), M.dark, -0.6 + k * 0.24, 1.95, -1.68); add(new THREE.BoxGeometry(0.08, 0.06, 0.05), M.iron, -0.6 + k * 0.24, 2.15, -1.67); } // estante de ferramentas
    for (const zz of [0.5, 0.9]) add(new THREE.BoxGeometry(0.2, 0.28, 0.14), std(0x6a3a22), -0.9, 1.55, zz); // alforjes
    add(new THREE.BoxGeometry(0.04, 0.04, 0.5), M.dark, -0.88, 2.35, 1.3); const sign = add(new THREE.BoxGeometry(0.03, 0.4, 0.4), M.oak, -0.88, 2.05, 1.5); void sign; add(new THREE.BoxGeometry(0.02, 0.1, 0.26), M.iron, -0.9, 2.08, 1.5); add(new THREE.BoxGeometry(0.02, 0.08, 0.1), M.iron, -0.9, 2.0, 1.5); } // placa da bigorna
  /* estandarte dos anões */
  add(new THREE.CylinderGeometry(0.025, 0.025, 1.3, 5), M.dark, 0.7, 2.1, -1.6);
  const flag = add(new THREE.PlaneGeometry(0.5, 0.3, 4, 1), std(0x8a3a1c, { side: THREE.DoubleSide }), 0.7, 2.6, -1.85); flag.rotation.y = Math.PI / 2;
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4), M.iron, -0.7, 1.7, 1.2); add(new THREE.BoxGeometry(0.14, 0.18, 0.14), M.glass, -0.7, 1.9, 1.2);
  const lamp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); lamp.position.set(-0.7, 1.9, 1.2); lamp.scale.setScalar(1.6); lamp.visible = false; body.add(lamp);
  const stack = new THREE.Group(); stack.visible = false; body.add(stack); const { hpBar, hpFill } = hpBarFor(); root.add(hpBar);
  root.traverse((o) => { o.frustumCulled = true; });
  const W0: Wagon = { root, body, wheels, stack, lamp, flag, fallen: false, hpBar, hpFill, horse, kind: 'dwarf' };
  const keepH = (o: THREE.Object3D) => (o.parent === body && o.position.z > 4.2) /* só os tirantes entre as parelhas: os varais são os do modelo */ || ((horse as Horse4 & { team?: Horse4[] }).team ?? [horse]).some((h) => isIn(o, (h as unknown as { root: THREE.Object3D }).root));
  return artBody(W0, 'carroca_anao', keepH, 1.8, ART_FLIP.dwarf, -1);
}
/** a carroça coberta dos mercadores humanos: caixa de tábuas, lona em arcos, sacos e caixotes, puxada por quatro cavalos */
export function buildMerchantWagon(): Wagon {
  const M = mats(), root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, p: THREE.Object3D = body) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
  add(new THREE.BoxGeometry(1.6, 0.14, 3.2), M.dark, 0, 0.8, -0.2);
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.1, 0.5, 3.2), M.oak, sx * 0.78, 1.1, -0.2); add(new THREE.BoxGeometry(1.6, 0.5, 0.1), M.oak, 0, 1.1, -1.8); add(new THREE.BoxGeometry(1.6, 0.4, 0.1), M.oak, 0, 1.05, 1.4);
  const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.6, 14, 1, true, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2), std(0xe0d2b0, { side: THREE.DoubleSide })); cover.position.set(0, 1.3, -0.5); cover.scale.y = 1.3; cover.castShadow = true; body.add(cover);
  for (const zz of [-1.7, -1.0, -0.3, 0.4]) { const arc = add(new THREE.TorusGeometry(0.86, 0.04, 4, 14, Math.PI), M.dark, 0, 1.3, zz); arc.scale.y = 1.3; }
  { const cap = add(new THREE.CircleGeometry(0.85, 14, 0, Math.PI), std(0xc8ba98), 0, 1.3, -1.82); cap.rotation.y = Math.PI; cap.scale.y = 1.3; }
  /* sacos e caixotes na boca */
  add(new THREE.SphereGeometry(0.26, 8, 6), std(0xa08a60), -0.35, 1.1, 0.9); add(new THREE.SphereGeometry(0.22, 8, 6), std(0xb09a70), 0.3, 1.06, 0.95); add(new THREE.BoxGeometry(0.4, 0.3, 0.4), M.oak, 0.35, 1.02, 0.4);
  const wheels: Wagon['wheels'] = [];
  for (const [zz, r] of [[-1.2, 0.66], [1.1, 0.5]] as [number, number][]) { add(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6).rotateZ(Math.PI / 2), M.iron, 0, r, zz);
    for (const sx of [-1, 1]) { const w = wheel(r, 0.1), hold = new THREE.Group(); hold.position.set(sx * 0.9, r, zz); hold.rotation.y = Math.PI / 2; hold.add(w); body.add(hold); wheels.push({ m: w, r }); } }
  add(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 6).rotateZ(Math.PI / 2), M.dark, 0, 1.4, 1.2);
  for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.035, 0.035, 2.4, 5).rotateX(Math.PI / 2), M.dark, sx * 0.5, 0.9, 2.6);
  /* parelha: dois cavalos lado a lado */
  const team: Horse4[] = []; /* 03/11 (Erling: "4 cavalos melhor que 2, gostei mais"): duas parelhas, como a dos anões */
  for (const [sx, zz] of [[-0.66, 3.7], [0.66, 3.7], [-0.66, 6.5], [0.66, 6.5]] as [number, number][]) { const i = team.length, h = teamHorse(i % 2 ? 'cavalo_porto_caldeira' : 'cavalo_orm', [undefined, undefined, 0xd8c8b0, 0x8a7a6a][i], { coat: sx < 0 ? 0x8a5a34 : 0x6a4a30, mane: 0x2a1a10, socks: sx < 0 }); h.root.position.set(sx, 0, zz); body.add(h.root); team.push(h); }
  for (const sx of [-0.66, 0.66]) add(new THREE.CylinderGeometry(0.03, 0.03, 2.8, 5).rotateX(Math.PI / 2), M.dark, sx, 0.95, 5.1); /* tirantes entre as parelhas */
  add(new THREE.BoxGeometry(1.4, 0.08, 0.08), M.dark, 0, 0.95, 2.5); const horse = team[0]; (horse as Horse4 & { team?: Horse4[] }).team = team;
  add(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 5), M.dark, -0.65, 2.0, -1.7);
  const flag = add(new THREE.PlaneGeometry(0.45, 0.28, 4, 1), std(0x3a6a9a, { side: THREE.DoubleSide }), -0.65, 2.45, -1.92); flag.rotation.y = Math.PI / 2;
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4), M.iron, 0.65, 1.7, 1.3); add(new THREE.BoxGeometry(0.14, 0.18, 0.14), M.glass, 0.65, 1.9, 1.3);
  const lamp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); lamp.position.set(0.65, 1.9, 1.3); lamp.scale.setScalar(1.6); lamp.visible = false; body.add(lamp);
  const stack = new THREE.Group(); stack.visible = false; body.add(stack); const { hpBar, hpFill } = hpBarFor(); root.add(hpBar);
  root.traverse((o) => { o.frustumCulled = true; });
  /* 03/11 (Erling: "tem que ser TODAS"): a carroça das estradas humanas também vira a carroça do Herik (os dois cavalos continuam) */
  const W0: Wagon = { root, body, wheels, stack, lamp, flag, fallen: false, hpBar, hpFill, horse, kind: 'human' };
  const keepH = (o: THREE.Object3D) => (o.parent === body && o.position.z > 4.5) || ((horse as Horse4 & { team?: Horse4[] }).team ?? [horse]).some((h) => isIn(o, (h as unknown as { root: THREE.Object3D }).root));
  return artBody(W0, 'carroca_anao', keepH, 1.8, ART_FLIP.dwarf, -1);
}
/** a carroça caída: tomba de lado, uma roda solta, carga espalhada (resgate e emboscada perdida) */
function topple(w: Wagon) { if (w.fallen) return; w.fallen = true; w.body.rotation.z = 0.42; w.body.position.y = -0.25; const lost = w.wheels[1].m.parent!; w.body.remove(lost); w.root.add(lost); lost.rotation.set(Math.PI / 2 - 0.2, 0, 0); lost.position.set(1.9, 0.1, -2.6); w.lamp.visible = false;
  const M = mats(); for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(i % 2 ? new THREE.CylinderGeometry(0.22, 0.22, 0.5, 9) : new THREE.CylinderGeometry(0.3, 0.32, 0.12, 9), i % 2 ? M.oak : M.brass); c.position.set(-1.6 - (i % 3) * 0.6, 0.2, -1.6 + i * 0.7); c.rotation.set(i % 2 ? Math.PI / 2 : 0, i, 0); c.castShadow = true; w.root.add(c); } }

/* ================= a lógica ================= */
type Mode = 'ambient' | 'escort' | 'rescue' | 'event';
interface Car { key: string; mode: Mode; /** QUAL carroça é esta (28/10): a bandeira é da carroça, não da rota — vapor e anões rodam todas as estradas */ carroca?: 'carrocaAVapor' | 'carrocaDosAnoes'; /** negociando com o jogador (parada) e o atraso acumulado */ trading?: boolean; lag?: number; /** afastamento lateral atual (mão da estrada; some nas pontes) */ off?: number; route: Route; s: number; dir: number; w: Wagon | null; crew: Hero3D[]; hp: number; stop: boolean; speed: number; arrived?: boolean; ambush?: number[]; fight?: boolean; foes: { alive: boolean; pos: THREE.Vector3; hp: number; hpMax: number }[]; bubbleT: number; spawned?: boolean; cleared?: boolean; slot?: number; lastNear?: number; failT?: number; note?: string }
export interface CaravanCtx {
  scene: THREE.Scene; heightAt(x: number, z: number): number; hero(): THREE.Vector3; night(): number; inside(): boolean; lvl(): number;
  spawn(type: EnemyType, x: number, z: number, o: { name: string; lvl: number; tag: string; aggro: number; hpMul: number }): { alive: boolean; pos: THREE.Vector3; hp: number; hpMax: number; def: { name: string } };
  clearTag(tag: string): void; hurt?(e: unknown, n: number, from: THREE.Vector3): void; /** a janela da loja está aberta (a carroça espera) */ shopOpen?(): boolean; /** o ponto (m) está em cima de uma ponte ou nas cabeceiras dela */ onBridge?(x: number, z: number): boolean;
  smoke(x: number, y: number, z: number, dark: boolean): void; /** brasa saindo da fornalha */ ember?(x: number, y: number, z: number): void; bubble(x: number, y: number, z: number, t: string): void;
  log(t: string, c?: string): void; onEscort(id: string): void; onRescue(id: string): void;
  onEvent(r: Route, how: 'salva' | 'saque' | 'perdida'): void; lean(): 'luz' | 'sombra' | null;
  /** conversar com o cocheiro de uma caravana que passa: comerciar com a Companhia na estrada */ trade?(r: Route, carroca: 'carrocaAVapor' | 'carrocaDosAnoes'): void;
  /** dentro ou perto de uma vila (regra 15: ninguém luta nas vilas; emboscada só na estrada aberta) */ nearTown(x: number, z: number): boolean;
}
/** falas do cocheiro, por momento */
const SAY = { wait: ['Pronta quando você estiver. Fique perto: sem escolta eu não saio do lugar.', 'O vapor está no ponto. É só você chegar perto.'], go: ['Lá vamos nós. Olhos na estrada!', 'Caldeira cheia, rodas firmes. Em frente.'],
  far: ['Ei! Não me deixe sozinha na estrada!', 'Vou esperar aqui. Volte logo.'], ambush: ['Emboscada! Protejam a carga!', 'Estão vindo pelos dois lados!', 'A caldeira não aguenta muita pancada. Rápido!'], clear: ['Ufa. Ninguém ferido. Seguimos.', 'Bom trabalho. A Companhia não esquece.'],
  low: ['A carroça está se desfazendo!', 'Mais um golpe e a gente tomba!'], arrive: ['Chegamos. A Companhia paga o que promete.', 'Carga entregue, inteira. Obrigada, de verdade.'], fall: ['Tombamos! Volte ao ponto de saída, vamos tentar de novo!'] };
/** onde a escolta é emboscada: estrada curta, uma vez; média, duas; longa, três */
const ambushAt = (len: number) => len > 380 ? [0.25, 0.52, 0.8] : len > 150 ? [0.33, 0.7] : [0.5];
const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];

export function createCaravans(ctx: CaravanCtx, routes: Map<string, Route>) {
  const cars = new Map<string, Car>();
  const SAVE = 'karmika.caravan.v1'; let saved: { done: number[]; looted: number; saved: number } = { done: [], looted: 0, saved: 0 };
  try { Object.assign(saved, JSON.parse(localStorage.getItem(SAVE) || '{}')); } catch { /* */ }
  const persist = () => { try { saved.done = saved.done.slice(-30); localStorage.setItem(SAVE, JSON.stringify(saved)); } catch { /* */ } };
  /** relógio do mundo (segundos): o mesmo em toda máquina */
  const now = () => Date.now() / 1000;
  /** anda pela estrada até sair de perto das vilas */
  const openRoad = (r: Route, s0: number) => { for (let k = 0; k < 60; k++) { const s = (s0 + k * 8) % r.len, p = at(r, s); if (!ctx.nearTown(p.x, p.z)) return s; } return s0; };
  const SPEED = 3.1, PERIOD_PAD = 40, /** a escolta espera um pouco fora do portão, não dentro dele */ START = 9;
  function ambientS(r: Route, i: number, lag = 0) { const per = r.len / SPEED + PERIOD_PAD, cyc = per * 2, t = (now() - lag + i * 977) % cyc; // vai, para, volta
    const go = Math.max(0, Math.min(1, t / (per - PERIOD_PAD))), back = Math.max(0, Math.min(1, (t - per) / (per - PERIOD_PAD)));
    /* 26/10 (Erling: "uma carroça não atravessa a outra"): cada rota estaciona na sua vaga, alguns metros antes do centro da vila — duas rotas que
       terminam na mesma praça nunca param uma em cima da outra */
    let hh = 7; for (const ch of r.id) hh = (hh * 31 + ch.charCodeAt(0)) % 9973; const bay = Math.min(r.len * 0.25, 6 + ((hh + i * 3) % 5) * 6.5);
    const pos = (k: number) => bay + k * (r.len - 2 * bay);
    return t < per ? { s: pos(go), dir: 1, park: go >= 1 } : { s: pos(1 - back), dir: -1, park: back >= 1 }; }
  /* a emboscada do mundo: a cada 9 minutos uma rota é sorteada (pelo relógio), num ponto entre 30% e 70% da estrada; dura 9 minutos */
  const EV = 540;
  function eventNow() { const slot = Math.floor(now() / EV), h = Math.abs(Math.sin(slot * 12.9898) * 43758.5453) % 1, ids = AMBIENT.filter((id) => routes.has(id)); if (!ids.length) return null;
    const r = routes.get(ids[Math.floor(h * ids.length)])!; return { slot, r, s: openRoad(r, r.len * (0.3 + ((h * 7.31) % 1) * 0.4)), left: EV - (now() % EV) }; }

  /** qual carroça faz a vez i desta estrada: 1ª vapor, 2ª anões, a 3ª (estradas longas) alterna de estrada para estrada */
  /** 28/10: qual carroça faz a viagem agora. Cada carroça troca a cada ida e volta (vapor, anões, vapor…), e a vez i começa
      defasada: com o tempo as duas passam por todas as estradas, sem dobrar o número de carroças no mundo (o FPS agradece) */
  const ambCar = (r: Route, i: number): 'carrocaAVapor' | 'carrocaDosAnoes' => { const per = r.len / SPEED + PERIOD_PAD, trip = Math.floor((now() + i * 977) / (per * 2)); let hh = 0; for (const ch of r.id) hh += ch.charCodeAt(0); return (trip + i + hh) % 2 === 0 ? 'carrocaAVapor' : 'carrocaDosAnoes'; };
  const carOf = (c: Car) => c.carroca ?? c.route.carroca ?? 'carrocaAVapor';
  function crewFor(c: Car) { if (c.crew.length) return; const kind = carOf(c) === 'carrocaAVapor' ? 'steam' : 'dwarf';
    const drv = kind === 'steam' ? createCharacter('technocrat', { static: true }) : createCharacter('dwarf', { static: true }); /* carroças são de anões (Erling) */
    const g1 = kind === 'steam' ? createCharacter('nordic', { static: true }) : createCharacter('dwarf', { static: true }), g2 = createCharacter('dwarf', { static: true });
    for (const h of [drv, g1, g2]) { h.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.castShadow = false; }); h.root.userData.farCull = true; ctx.scene.add(h.root); }
    try { g1.setGear({ weapon: { base: 'Espada Longa', rarity: 'common' }, shield: { base: 'Escudo Redondo', rarity: 'common', seed: 3 } }); g2.setGear({ weapon: { base: 'Machado de Guerra', rarity: 'common' } }); } catch { /* */ }
    c.crew = [drv, g1, g2];
    /* 08/11 (Erling: "os que acompanham as carroças também" com o modelo vestido): cocheiro de couro, guardas com armadura (anões); o tecnocrata e o nórdico do vapor com os seus */
    const SK: Record<string, string> = { dwarfDrv: '/models/personagens/anao_h_lvl02.glb', dwarfG: '/models/personagens/anao_h_lvl03.glb', nordic: '/models/personagens/guerreiro_h_lvl02.glb', technocrat: '/models/personagens/technocrata_h.glb' };
    const want: [Hero3D, string][] = [[drv, kind === 'steam' ? SK.technocrat : SK.dwarfDrv], [g1, kind === 'steam' ? SK.nordic : SK.dwarfG], [g2, SK.dwarfG]];
    for (const [h, fbx] of want) attachSkin(h, { fbx, tex: '' }).then((r) => { if (!r) return; if (!c.crew.includes(h)) { h.root.remove(r.model); return; } r.model.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.castShadow = false; }); (h as Hero3D & { skinTick?: () => void }).skinTick = r.tick; }).catch(() => { /* fica o procedural */ }); }
  /* 26/10 noite (desempenho): a carroça das rotas do mundo que sai de perto fica GUARDADA (fora da cena) e volta igual quando você
     chega — antes ela era montada de novo (carroça, cavalos e tripulação) toda vez que cruzava os 120 m, um soluço de vários ms. */
  const parked = new Map<string, { w: NonNullable<Car['w']>; crew: Car['crew'] }>();
  function ensureModel(c: Car) { if (c.w) return; const pk = c.mode === 'ambient' ? parked.get(c.key) : undefined;
    if (pk) { parked.delete(c.key); c.w = pk.w; c.crew = pk.crew; ctx.scene.add(c.w.root); for (const h of c.crew) ctx.scene.add(h.root); return; }
    c.w = carOf(c) === 'carrocaAVapor' ? buildSteamWagon() : c.route.kind === 'human' ? buildMerchantWagon() : buildOreCart(); c.w.root.userData.farCull = true; ctx.scene.add(fine(c.w.root)); crewFor(c); if (c.mode === 'rescue' || (c.mode === 'event' && c.hp <= 0)) topple(c.w); }
  function dropModel(c: Car) { if (!c.w) return; ctx.scene.remove(c.w.root); for (const h of c.crew) ctx.scene.remove(h.root); if (c.mode === 'ambient' && !c.w.fallen) parked.set(c.key, { w: c.w, crew: c.crew }); c.w = null; c.crew = []; }
  function say(c: Car, t: string) { if (!c.w) return; const p = c.w.root.position; ctx.bubble(p.x, p.y + 3.2, p.z, t); c.bubbleT = 4; }

  function startEscort(id: string) { const r = routes.get(id); if (!r) return false; cars.get('esc:' + id) && stopEscort(id);
    cars.set('esc:' + id, { key: 'esc:' + id, mode: 'escort', route: r, s: START, dir: 1, w: null, crew: [], hp: 1, stop: true, speed: SPEED, foes: [], bubbleT: 0, ambush: ambushAt(r.len) }); return true; }
  function stopEscort(id: string) { const c = cars.get('esc:' + id); if (!c) return; dropModel(c); ctx.clearTag('car:' + c.key); cars.delete(c.key); }
  function startRescue(id: string, frac: number, note?: string) { const r = routes.get(id); if (!r) return; if (cars.get('res:' + id)) return;
    cars.set('res:' + id, { key: 'res:' + id, mode: 'rescue', route: r, s: openRoad(r, r.len * frac), dir: 1, w: null, crew: [], hp: 0, stop: true, speed: 0, foes: [], bubbleT: 0, note: note ?? `Entre as tábuas, o livro de bordo da Companhia: “${r.name}. Carga conferida.” O resto está manchado de lama.` }); }
  /** soft: a carroça limpa, ainda esperando ser examinada, fica até o exame */
  function stopRescue(id: string, soft = false) { const c = cars.get('res:' + id); if (!c) return; if (soft && c.cleared && c.note !== undefined) return; dropModel(c); ctx.clearTag('car:' + c.key); cars.delete(c.key); }

  function spawnAmbush(c: Car, n: number) {
    const R = c.route, p = at(R, c.s), side = [1, -1]; c.foes = [];
    for (let i = 0; i < n; i++) { const ahead = c.mode === 'escort' ? 9 + i * 1.5 : (i - n / 2) * 2.5, sd = side[i % 2] * (4 + (i % 3)), q = at(R, c.s + ahead * c.dir);
      const x = q.x + Math.cos(q.yaw) * sd, z = q.z - Math.sin(q.yaw) * sd, type = R.foes[i % R.foes.length];
      const e = ctx.spawn(type, x, z, { name: R.names?.[type] ?? R.foeName, lvl: R.lvl, tag: 'car:' + c.key, aggro: 18, hpMul: 1.15 }); c.foes.push(e); }
    c.fight = true; void p;
  }
  const alive = (c: Car) => c.foes.filter((f) => f.alive).length;
  /** algum bicho da emboscada em cima da carroça: ela sofre */
  function wagonDamage(c: Car, dt: number) { const n = alive(c); if (!n || !c.w) return; const p = c.w.root.position; let close = 0; for (const f of c.foes) if (f.alive && Math.hypot(f.pos.x - p.x, f.pos.z - p.z) < 9) close++;
    c.hp -= dt * (0.004 * n + 0.01 * close); if (c.hp < 0.3 && c.bubbleT <= 0) say(c, pick(SAY.low)); }

  let evShown: { slot: number; r: Route; s: number } | null = null;
  function update(dt: number, t: number) {
    const hp = ctx.hero(), night = ctx.night(), inside = ctx.inside();
    /* caravanas do mundo */
    for (const id of AMBIENT) { const r = routes.get(id); if (!r) continue; for (let i = 0; i < (r.len > 300 ? 2 : 1); i++) { const key = `amb:${id}:${i}`; let c = cars.get(key); /* 28/10 (Erling): toda estrada vê as duas — a carroça a vapor e a dos anões se revezam a cada viagem */
      if (c && c.carroca !== ambCar(r, i) && !c.trading) { dropModel(c); parked.delete(key); c.carroca = ambCar(r, i); }
      if (!c) { c = { key, mode: 'ambient', carroca: ambCar(r, i), route: r, s: 0, dir: 1, w: null, crew: [], hp: 1, stop: false, speed: SPEED, foes: [], bubbleT: 0 }; cars.set(key, c); }
      /* 26/10 (Erling: "clico na carroça, abro a janela deles e eles vão embora andando?"): enquanto você negocia, ela espera; o atraso
         fica com ela (chega um pouco mais tarde) */
      if (c.trading) { if (ctx.shopOpen?.()) { c.lag = (c.lag ?? 0) + dt; } else { c.trading = false; } }
      const a = ambientS(r, i, c.lag ?? 0); c.s = a.s; c.dir = a.dir; c.stop = a.park || !!c.trading; } }
    /* a emboscada do mundo (uma por vez) */
    const ev = eventNow();
    if (ev && !saved.done.includes(ev.slot)) { const key = 'ev:' + ev.slot; if (!cars.has(key)) { for (const k of [...cars.keys()]) if (k.startsWith('ev:')) { const o = cars.get(k)!; dropModel(o); ctx.clearTag('car:' + k); cars.delete(k); }
        cars.set(key, { key, mode: 'event', route: ev.r, s: ev.s, dir: 1, w: null, crew: [], hp: 1, stop: true, speed: 0, foes: [], bubbleT: 0, slot: ev.slot }); }
      evShown = { slot: ev.slot, r: ev.r, s: ev.s }; } else evShown = null;
    const placed: { x: number; z: number }[] = []; WAGON_BLOCK.length = 0;
    for (const c of [...cars.values()]) {
      const p = at(c.route, c.s), dH = Math.hypot(p.x - hp.x, p.z - hp.z), near = dH < (c.mode === 'ambient' ? 120 : 160) + (c.w ? 20 : 0) && !inside; /* +20 m para quem já está montada: não monta e desmonta na borda */
      if (!near) { if (c.w) dropModel(c); if (c.mode === 'event' && c.spawned && !c.cleared && ev && c.slot !== ev.slot) { ctx.clearTag('car:' + c.key); cars.delete(c.key); } continue; }
      ensureModel(c); const w = c.w!;
      // escolta: anda só com você perto; emboscadas em pontos fixos
      if (c.mode === 'escort' && !c.arrived) {
        if (c.failT !== undefined) { c.failT -= dt; if (c.failT <= 0) { c.failT = undefined; ctx.clearTag('car:' + c.key); c.foes = []; c.fight = false; c.s = START; c.hp = 1; dropModel(c); c.ambush = ambushAt(c.route.len); ctx.log(`⚙ A caravana voltou para ${c.route.from}. Fale de novo com a escolta quando quiser recomeçar: ela espera.`, '#e0b048'); } continue; }
        const wasStop = c.stop;
        if (c.fight) { c.stop = true; wagonDamage(c, dt); if (c.hp <= 0) { c.hp = 0; topple(w); say(c, pick(SAY.fall)); ctx.log('💥 A caravana tombou. A escolta falhou desta vez.', '#ff8a7a'); c.failT = 6; continue; }
          if (!alive(c)) { c.fight = false; say(c, pick(SAY.clear)); } }
        else if (dH > 24) { c.stop = true; if (!wasStop && c.s > START) say(c, pick(SAY.far)); }
        else if (dH < 11 || (c.s > START && dH < 24)) { if (c.stop && c.s <= START) say(c, pick(SAY.go)); c.stop = false; }
        else if (c.s <= START && c.bubbleT <= 0) say(c, pick(SAY.wait));
        if (!c.stop) { c.s += c.speed * dt; const f = c.s / c.route.len; if (c.ambush?.length && f >= c.ambush[0] && !ctx.nearTown(at(c.route, c.s).x, at(c.route, c.s).z)) { c.ambush.shift(); c.stop = true; spawnAmbush(c, 3 + Math.min(2, Math.floor(ctx.lvl() / 18))); say(c, pick(SAY.ambush)); }
          if (c.s >= c.route.len - 2) { c.arrived = true; c.stop = true; say(c, pick(SAY.arrive)); ctx.log(`⚙ Caravana entregue em ${c.route.stops[c.route.stops.length - 1]}: ${c.route.name}.`, '#e0b048'); ctx.onEscort(c.route.id); setTimeout(() => stopEscort(c.route.id), 25000); } }
        w.hpBar.visible = true; w.hpFill.scale.x = Math.max(0.001, c.hp); w.hpFill.position.x = -1.05 * (1 - c.hp); (w.hpFill.material as THREE.MeshBasicMaterial).color.setHex(c.hp > 0.5 ? 0xe0b048 : c.hp > 0.25 ? 0xff9a40 : 0xff4a3a);
      }
      // resgate: bichos em volta da carroça tombada; limpou, está feito
      if (c.mode === 'rescue' && !c.cleared) { if (!c.spawned && dH < 70) { c.spawned = true; spawnAmbush(c, 5); ctx.log(`⚠ A caravana caída está cercada (${c.route.foeName} e outros). Limpe a área!`, '#ff9a6a'); }
        if (c.spawned && !alive(c)) { c.cleared = true; c.fight = false; ctx.onRescue(c.route.id); ctx.log('⚙ A caravana caída está livre. Examine os destroços (E).', '#e0b048'); } }
      // emboscada do mundo: quem chega encontra a luta; se a carroça cair, foi saqueada por eles
      if (c.mode === 'event' && !c.cleared) { if (!c.spawned && dH < 55) { c.spawned = true; spawnAmbush(c, 4); say(c, 'Socorro! Pela Companhia, socorro!'); }
        if (c.spawned) { if (c.hp > 0) wagonDamage(c, dt * 0.6); if (c.hp <= 0 && !w.fallen) { topple(w); ctx.log('💥 A caravana atacada tombou. Ainda dá para afastar os bichos e salvar o que sobrou.', '#ff8a7a'); }
          if (!alive(c)) { c.cleared = true; c.fight = false; say(c, w.fallen ? 'A carga… o que sobrou. Obrigado por vir.' : 'Você salvou a gente. A Companhia vai saber disso.'); } } }
      // posição, inclinação no terreno e animação
      const yaw = p.yaw + (c.dir < 0 ? Math.PI : 0), ca = Math.sin(yaw), cb = Math.cos(yaw);
      /* 26/10 (Erling: "carroças não se atravessam assim"): cada uma anda pela sua mão (direita no sentido em que vai); as que
         se cruzam passam lado a lado, e as que vão juntas na mesma rota já saem em horários diferentes */
      if (c.mode === 'ambient') { const crowd = placed.some((q) => Math.hypot(q.x - p.x, q.z - p.z) < Math.max(5.5, (w.box?.hl ?? 2) * 2 + 1)), want = ctx.onBridge?.(p.x, p.z) ? 0.3 : c.stop && !c.trading ? Math.max(4.8, (w.box?.hw ?? 1) + 3) : crowd ? Math.max(4.6, (w.box?.hw ?? 1) * 2 + 0.8) : 1.7; /* 27/10 (Erling: as carroças paradas tapavam o portão): estacionada, encosta no acostamento, fora do vão da estrada */ /* outra carroça ali: encosta mais para a direita e passa ao lado */ /* na ponte, manobra para o meio: a ponte é estreita (Erling: "passar certinho pelas pontes") */ c.off = (c.off ?? want) + (want - (c.off ?? want)) * Math.min(1, dt * 1.6); p.x += cb * c.off; p.z -= ca * c.off; }
      const hl0 = Math.min(3, w.box?.hl ?? 1.3), hF = ctx.heightAt(p.x + ca * hl0, p.z + cb * hl0), hB = ctx.heightAt(p.x - ca * hl0, p.z - cb * hl0);
      w.root.position.set(p.x, (hF + hB) / 2, p.z); placed.push({ x: p.x, z: p.z }); if (w.box && !w.fallen) WAGON_BLOCK.push({ x: p.x, z: p.z, yaw, ...w.box }); w.root.rotation.set(0, 0, 0); w.root.rotation.y = yaw; if (!w.fallen) w.body.rotation.x = -Math.atan2(hF - hB, hl0 * 2) * 0.9;
      const moving = !c.stop && !w.fallen && !(c.mode === 'ambient' && c.stop);
      if (moving) for (const wh of w.wheels) wh.m.rotation.z += (c.speed * dt) / wh.r;
      w.lamp.visible = !w.fallen && night > 0.35; (w.lamp.material as THREE.SpriteMaterial).opacity = 0.6 + Math.sin(t * 9) * 0.08;
      { const fp = w.flag.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < fp.count; i++) { const x0 = (i % 5) / 4; fp.setZ(i, Math.sin(t * 6 + x0 * 3) * 0.06 * x0); } fp.needsUpdate = true; }
      if (w.horse) for (const h of (w.horse as Horse4 & { team?: Horse4[] }).team ?? [w.horse]) h.pose({ dt, mv: moving ? c.speed : 0, idle: !moving });
      if (w.kind === 'steam') { const fa = (w as Wagon & { fire?: THREE.Sprite }).fire; if (fa) { const fl = 0.75 + 0.25 * Math.sin(performance.now() / 90 + p.x) * Math.sin(performance.now() / 37); (fa.material as THREE.SpriteMaterial).opacity = w.fallen ? 0.2 : fl; fa.scale.setScalar(1.25 * (0.9 + 0.15 * fl));
          if (!w.fallen && ctx.ember && Math.random() < (moving ? 0.35 : 0.18)) { const q = fa.getWorldPosition(new THREE.Vector3()); ctx.ember(q.x, q.y, q.z); } } }
      if (w.kind === 'steam' && Math.random() < (moving ? 0.95 : w.fallen ? 0.35 : 0.6)) { const s = ((w as Wagon & { smokeAt?: THREE.Vector3 }).smokeAt?.clone() ?? new THREE.Vector3(0, 3.4, 1.25)).applyEuler(new THREE.Euler(w.body.rotation.x, yaw, w.body.rotation.z)); ctx.smoke(p.x + s.x, w.root.position.y + s.y, p.z + s.z, w.fallen); }
      // a tripulação: cocheiro no banco, guardas a pé dos dois lados (de frente para a luta quando há luta)
      const [drv, g1, g2] = c.crew;
      if (drv) { if (w.fallen) { drv.root.position.set(p.x - cb * 2.4, ctx.heightAt(p.x - cb * 2.4, p.z + ca * 2.4), p.z + ca * 2.4); drv.update(dt, t, 0, yaw + 2); (drv as Hero3D & { skinTick?: () => void }).skinTick?.(); }
        else { const sp = (w.seat?.clone() ?? new THREE.Vector3(0, 1.45, 0.3)).applyEuler(new THREE.Euler(w.body.rotation.x, yaw, 0)); drv.root.position.set(p.x + sp.x, w.root.position.y + sp.y, p.z + sp.z); drv.update(dt, t, 0, yaw); (drv as Hero3D & { skinTick?: () => void }).skinTick?.(); } }
      let foe: { pos: THREE.Vector3; hp: number; hpMax: number } | null = null, fd = 1e9; for (const f of c.foes) if (f.alive) { const d = f.pos.distanceTo(w.root.position); if (d < fd) { fd = d; foe = f; } }
      [g1, g2].forEach((g, k) => { if (!g) return; const sd = (k ? -1 : 1) * Math.max(1.6, (w.box?.hw ?? 1) + 0.7), back = k ? 0.6 : -0.8; let gx = p.x + cb * sd - ca * back, gz = p.z - ca * sd - cb * back, mps = moving ? c.speed : 0, face = yaw;
        if (foe && fd < 16) { const dx = foe.pos.x - gx, dz = foe.pos.z - gz, l = Math.hypot(dx, dz); face = Math.atan2(dx, dz); if (l > 1.6 && l < 7) { gx += dx / l * Math.min(l - 1.6, 2.5); gz += dz / l * Math.min(l - 1.6, 2.5); } g.combat = true; if (Math.random() < dt * 0.8) g.act('combo1'); } else g.combat = false;
        if (w.fallen && !foe) { face = yaw + (k ? 2.4 : -2.4); }
        g.root.position.set(gx, ctx.heightAt(gx, gz), gz); g.update(dt, t, mps, face); (g as Hero3D & { skinTick?: () => void }).skinTick?.(); /* o boneco só vira pelo heading: antes olhava sempre para o norte (Erling: "os NPC de lado?") */ });
      // os guardas também batem (de leve: o golpe que mata é seu)
      if (foe && fd < 3.2 && ctx.hurt && Math.random() < dt * 0.7) { const f = foe; if (f.hp > f.hpMax * 0.25) ctx.hurt(foe, Math.max(1, Math.round(f.hpMax * 0.06)), w.root.position); }
      if (c.bubbleT > 0) c.bubbleT -= dt;
      if (c.mode !== 'escort') w.hpBar.visible = false;
    }
  }
  /** o que dá para fazer perto de uma carroça (o E) */
  function interact(hx: number, hz: number): { d: number; label: string; act: () => void } | null {
    for (const c of cars.values()) { if (!c.w) continue; const p = c.w.root.position, d = Math.hypot(p.x - hx, p.z - hz); if (d > 4.5) continue;
      if (c.mode === 'ambient' && ctx.trade) return { d, label: carOf(c) === 'carrocaAVapor' ? 'E — Falar com o cocheiro (comerciar com a Companhia de Latão)' : 'E — Falar com o cocheiro anão (comerciar)', act: () => { say(c, pick(carOf(c) === 'carrocaAVapor' ? ['Olha a mercadoria! Rápido, que o vapor não espera.', 'Da Companhia de Latão, direto do porto. Vai levar?'] : ['Ô! Pare aí, que a parelha descansa. O que vai ser?', 'Minério, cerveja e ferramenta boa. Dos anões, direto da Forja.'])); c.trading = true; ctx.trade!(c.route, carOf(c)); } };
      if (c.mode === 'escort' && c.s <= START && !c.arrived && c.failT === undefined) return { d, label: 'E — "Vamos?" (a caravana parte com você por perto)', act: () => { say(c, pick(SAY.go)); c.stop = false; } };
      if (c.mode === 'rescue' && c.cleared && c.note !== undefined) return { d, label: 'E — Examinar os destroços', act: () => { const r = c.route; ctx.log(`🔎 ${c.note}`, '#e0b048'); c.cleared = true; c.note = undefined; setTimeout(() => stopRescue(r.id), 20000); } };
      if (c.mode === 'event' && c.cleared && !saved.done.includes(c.slot!)) { const sombra = ctx.lean() === 'sombra', fallen = c.w.fallen;
        return { d, label: sombra && fallen ? 'E — A carga está sem dono…' : 'E — Ajudar os sobreviventes', act: () => {
          saved.done.push(c.slot!);
          if (sombra && fallen) { saved.looted = now(); ctx.onEvent(c.route, 'saque'); }
          else { saved.saved = now(); ctx.onEvent(c.route, 'salva'); }
          persist(); setTimeout(() => { const o = cars.get(c.key); if (o) { dropModel(o); cars.delete(c.key); } }, 15000); } }; }
    }
    return null;
  }
  /** para o mapa: caravanas andando, e a atacada piscando */
  function mapMarks(): { x: number; y: number; kind: 'move' | 'ev' | 'esc' | 'res'; name: string; sub: string }[] {
    const out: ReturnType<typeof mapMarks> = [];
    for (const id of AMBIENT) { const r = routes.get(id); if (!r) continue; for (let i = 0; i < (r.len > 300 ? 2 : 1); i++) { const a = ambientS(r, i), p = at(r, a.s); out.push({ x: p.x / T, y: p.z / T, kind: 'move', name: ambCar(r, i) === 'carrocaAVapor' ? 'Caravana de Latão (a vapor)' : r.kind === 'human' ? 'Caravana de mercadores anões' : 'Carroça de minério dos anões', sub: `${r.name}${a.park ? ' · parada' : ''}` }); } }
    if (evShown && !saved.done.includes(evShown.slot)) { const p = at(evShown.r, evShown.s), left = Math.ceil((EV - (now() % EV)) / 60); out.push({ x: p.x / T, y: p.z / T, kind: 'ev', name: 'Caravana atacada!', sub: `${evShown.r.name} · atacada por ${evShown.r.foeName} e outros · ~${left} min` }); }
    for (const c of cars.values()) { if (c.mode === 'escort' && !c.arrived) { const p = at(c.route, c.s); out.push({ x: p.x / T, y: p.z / T, kind: 'esc', name: 'Sua escolta', sub: c.route.name }); } if (c.mode === 'rescue' && !c.cleared) { const p = at(c.route, c.s); out.push({ x: p.x / T, y: p.z / T, kind: 'res', name: 'Caravana caída', sub: c.route.name }); } }
    return out;
  }
  /** para o guia de missão */
  function where(kind: 'escort' | 'rescue', id: string, frac = 0.5): { x: number; y: number } | null { const c = cars.get((kind === 'escort' ? 'esc:' : 'res:') + id), r = routes.get(id); if (!r) return null; const p = at(r, c ? c.s : kind === 'rescue' ? r.len * frac : START); return { x: p.x / T, y: p.z / T }; }
  /** a loja da Companhia: salvou há pouco → desconto e estoque do porto; saqueou → a Companhia sabe */
  function stock(): { k: number; extra: boolean; note: string } { const t = now();
    if (saved.looted && t - saved.looted < 3600) return { k: 1.3, extra: false, note: 'A Companhia sabe o que aconteceu com a carga. O preço subiu para você.' };
    if (saved.saved && t - saved.saved < 1800) return { k: 0.85, extra: true, note: 'Você salvou uma caravana: a carga do porto chegou e a Companhia agradece com desconto.' };
    const ev = eventNow(); if (ev && !saved.done.includes(ev.slot)) return { k: 1.1, extra: false, note: `Uma caravana está sob ataque (${ev.r.name}). Enquanto ela não chega, falta mercadoria.` };
    return { k: 1, extra: false, note: 'Mercadoria do porto, trazida pelas caravanas de latão.' }; }
  return { update, interact, mapMarks, where, stock, startEscort, stopEscort, startRescue, stopRescue, routes, escorting: (id: string) => cars.has('esc:' + id), arrivedEsc: (id: string) => !!cars.get('esc:' + id)?.arrived, /** (dev) */ dbg: () => cars };
}
