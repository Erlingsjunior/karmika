/* OS NAVIOS DA COMPANHIA DE LATÃO (07/11, Erling: "não há pedra de teleporte nas ilhas: só o serviço de barcos dos tecnocratas, em 4 regiões
   costeiras mais a cidade dos tecnocratas, vende a passagem — 10 mil de ouro — e embarcações gigantes levam os jogadores para lá").
   - Cada cais (World.docks) tem um navio a vapor ancorado no mar fundo: casco de ferro e madeira, rodas de pás, três chaminés fumegando,
     dois mastros. É maior que uma casa (regra 19: navio cargueiro é maior do que uma casa).
   - No continente: E no cais abre a bilheteria (as quatro ilhas, 10.000 de ouro cada). Na ilha: E no cais volta, de graça, para o porto
     de onde saiu (a passagem é de ida e volta). */
import * as THREE from 'three';
import { TILE_M as T } from '@karmika/shared';
import { heightAt, WL, ISLES, type Dock, type World } from '../world';

export interface NaviosCtx {
  readonly scene: THREE.Scene; readonly city: World; readonly game: { st: { gold: number; lvl: number; dead?: boolean }; logMsg(t: string, c?: string): void };
  readonly state: { fx: number; fy: number; path: unknown[] }; readonly withFade: (fn: () => void, label?: string) => void;
  readonly objs: { update(x: number, z: number, force?: boolean): void }; heroY: number; camX: number; camZ: number; camY: number;
  readonly inside: unknown; readonly combatMode: boolean; readonly audio?: { coin?(): void }; /** 09/11: a hora do jogo (0–24) para os horários dos navios */ readonly hour?: () => number;
}
export const PRICE = 10000;
const KEY_FROM = 'karmika.navio.de';

/** o navio: ~34 m de comprido, casco escuro com faixa de latão, convés de tábuas, castelo de popa, 3 chaminés, rodas de pás e 2 mastros */
function mkShip(seed: number): THREE.Group {
  const g = new THREE.Group(), M = (c: number, r = 0.85, m = 0.1) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const iron = M(0x2a2622, 0.7, 0.4), wood = M(0x6a4a2c), deck = M(0x9a7a52), brass = M(0xc8963a, 0.35, 0.8), red = M(0x7a2a22), sail = M(0xe8dcc0, 0.95);
  const L = 34, Wd = 9;
  /* casco: perfil afinando na proa, extrudado na altura */
  const hs = new THREE.Shape(); hs.moveTo(-L / 2, -Wd / 2); hs.lineTo(L / 2 - 7, -Wd / 2); hs.quadraticCurveTo(L / 2 + 1, -Wd / 4, L / 2 + 2, 0); hs.quadraticCurveTo(L / 2 + 1, Wd / 4, L / 2 - 7, Wd / 2); hs.lineTo(-L / 2, Wd / 2); hs.quadraticCurveTo(-L / 2 - 1.6, 0, -L / 2, -Wd / 2);
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(hs, { depth: 5.2, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, -2.6, 0), iron); g.add(hull);
  const band = new THREE.Mesh(new THREE.ExtrudeGeometry(hs, { depth: 0.35, bevelEnabled: false }).rotateX(-Math.PI / 2).translate(0, 1.6, 0).scale(1.012, 1, 1.03), brass); g.add(band);
  const dk = new THREE.Mesh(new THREE.ShapeGeometry(hs).rotateX(-Math.PI / 2).translate(0, 2.62, 0), deck); g.add(dk);
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y + h / 2, z); g.add(b); return b; };
  box(8, 3.2, 7, -11, 2.6, 0, wood); box(8.4, 0.3, 7.4, -11, 5.8, 0, red); box(5, 2.4, 5.2, -11, 6.1, 0, wood); box(5.4, 0.25, 5.6, -11, 8.5, 0, red); /* castelo de popa em dois andares */
  for (let i = 0; i < 6; i++) { const w = new THREE.Mesh(new THREE.CircleGeometry(0.42, 12), brass); w.position.set(-14.2 + i * 1.3, 4.3, 3.52); g.add(w); const w2 = w.clone(); w2.position.z = -3.52; w2.rotation.y = Math.PI; g.add(w2); } /* vigias de latão */
  for (const [x, h] of [[-2, 9], [2.2, 10], [6.4, 8.5]] as const) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, h, 14), iron); c.position.set(x, 2.6 + h / 2, 0); g.add(c); const r = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.12, 6, 16), brass); r.rotation.x = Math.PI / 2; r.position.set(x, 2.6 + h - 0.4, 0); g.add(r); }
  for (const z of [Wd / 2 + 0.9, -Wd / 2 - 0.9]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 1.2, 18, 1, true), wood); wh.rotation.x = Math.PI / 2; wh.position.set(1, 1.2, z); g.add(wh); const cap = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.3, 18, 1, false, 0, Math.PI), brass); cap.rotation.x = Math.PI / 2; cap.rotation.z = Math.PI / 2; cap.position.set(1, 2.2, z); g.add(cap); wh.name = 'wheel'; }
  for (const [x, h] of [[10.5, 15], [-6, 13]] as const) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, h, 8), wood); m.position.set(x, 2.6 + h / 2, 0); g.add(m); const yd = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 8, 6), wood); yd.rotation.x = Math.PI / 2; yd.position.set(x, 2.6 + h - 2, 0); g.add(yd);
    const sl = new THREE.Mesh(new THREE.PlaneGeometry(7.4, h * 0.42, 1, 4), sail); sl.position.set(x + 0.2, 2.6 + h - 2 - h * 0.21, 0); sl.rotation.y = Math.PI / 2; g.add(sl); }
  /* amurada com balaústres de latão */
  for (let i = 0; i < 22; i++) { const x = -L / 2 + 2 + i * 1.4; if (x > L / 2 - 6) break; for (const z of [Wd / 2 - 0.2, -Wd / 2 + 0.2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 5), brass); p.position.set(x, 3.1, z); g.add(p); } }
  for (const z of [Wd / 2 - 0.2, -Wd / 2 + 0.2]) { const rl = new THREE.Mesh(new THREE.BoxGeometry(L - 8, 0.08, 0.08), brass); rl.position.set(-1, 3.6, z); g.add(rl); }
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3), M(0xd0a040, 0.9)); flag.position.set(10.5 + 1.1, 2.6 + 15 - 0.6, 0); flag.rotation.y = Math.PI / 2; g.add(flag);
  g.userData.seed = seed; g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export function createNavios(K: NaviosCtx) {
  const docks = K.city.docks ?? [], ships: { d: Dock; g: THREE.Group; smoke: THREE.Points }[] = [];
  const smokeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d')!; const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(230,226,220,.9)'); gr.addColorStop(1, 'rgba(230,226,220,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
  for (const d of docks) { const g = mkShip(ships.length); g.position.set((d.sx + 0.5) * T, WL - 0.6, (d.sy + 0.5) * T); g.rotation.y = d.ang; /* de lado para o cais, como navio atracado */ K.scene.add(g);
    const n = 36, geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); const sm = new THREE.Points(geo, new THREE.PointsMaterial({ map: smokeTex, size: 3.2, transparent: true, depthWrite: false, opacity: 0.55 })); sm.frustumCulled = false; K.scene.add(sm);
    ships.push({ d, g, smoke: sm }); }
  /* a bilheteria */
  const el = document.createElement('div'); el.id = 'navios'; el.className = 'pn'; document.body.appendChild(el); let openAt: Dock | null = null;
  const fmt = (n: number) => n.toLocaleString('pt-BR');
  /* 09/11 (Erling: "cada embarcação com seu horário"): o navio de cada ilha sai a cada 3 horas do jogo, cada um na sua hora; o embarque abre
     40 minutos antes. Fora disso a passagem não é vendida — a tabuleta mostra a próxima saída. */
  const depOf = (id: number) => (id * 1.3) % 3; const hh = (h: number) => `${String(Math.floor(h) % 24).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;
  const sched = (id: number) => { const h = K.hour?.() ?? 12, b = depOf(id); let next = b; while (next < h - 0.001) next += 3; const wait = next - h; return { open: wait <= 0.66, at: hh(next), wait }; };
  function open(d: Dock) { openAt = d; const g = K.game.st.gold;
    if (d.isle) { el.innerHTML = `<h2>⚓ Navio da Companhia de Latão<button data-x>✕</button></h2><p class="nvtxt">O contramestre confere a sua passagem: <i>"A volta já está paga, Caminhante. Para onde?"</i></p><div class="nvlist"><button data-back class="gold">⛴ Voltar para ${backName()}</button></div>${routes(d)}<small class="nvft">${ISLES.find((q) => q.id === d.isle)?.name ?? ''} · sem relíquia: daqui só se sai de navio.</small>`; }
    else el.innerHTML = `<h2>⚓ Bilheteria da Companhia de Latão — ${d.name}<button data-x>✕</button></h2>${routes(d)}
      <p class="nvtxt">As embarcações a vapor da Academia levam Caminhantes às ilhas inóspitas do Mar de Karmika. Cada ilha tem uma cidade, vilas e pedras rúnicas próprias (que só ligam a mesma ilha); para voltar ao continente, só de navio. <b>Ida e volta: ${fmt(PRICE)} de ouro.</b></p>
      <div class="nvlist">${ISLES.filter((I) => !I.pen).map((I) => `<div class="nvrow"><div><b>${I.name}</b><small>Nível ${I.lo}–${I.hi} · ${I.biome === 'snow' ? 'gelo eterno' : I.biome === 'volcanic' ? 'vulcão' : I.biome === 'blight' ? 'noite eterna' : 'rocha e latão'}</small></div>${(() => { const sc = sched(I.id); return sc.open ? `<button data-go="${I.id}" class="gold" ${g < PRICE ? `disabled title="Você tem ${fmt(g)} de ouro"` : ''}>🎟 ${fmt(PRICE)} · sai às ${sc.at}</button>` : `<button disabled title="O embarque abre 40 minutos antes da saída">⏳ próximo às ${sc.at}</button>`; })()}</div>`).join('')}</div>
      <small class="nvft">Você tem ${fmt(g)} de ouro.${g < PRICE ? ' Junte mais e volte.' : ''}</small>`;
    el.style.display = 'block'; }
  /* 07/11 (Erling: "temos a rota comercial dos anões e dos tecnocratas de barco, que só abre para jogadores de nível alto, feita por NPC também"):
     os comboios mercantes ligam as ilhas entre si. Só aceitam Caminhante de nível 100 ou mais (o mar entre as ilhas é dos piratas e das serpentes) */
  const ROUTE_LV = 100, ROUTE_PRICE = 6000;
  const ROUTES = [{ k: 'anao', name: 'Barcaça dos Anões de Brasaforja', who: 'Capitã Hildra Malhofundo', isles: [44, 42] }, { k: 'tec', name: 'Comboio da Companhia de Latão', who: 'Comodoro Ezequiel Vapor', isles: [43, 41] }];
  function routes(d: Dock) { const lv = K.game.st.lvl, hereI = d.isle ?? 0;
    const rows = ROUTES.map((r) => { const dest = ISLES.filter((I) => !I.pen && r.isles.includes(I.id) && I.id !== hereI); if (!dest.length) return '';
      return `<div class="nvrt"><b>⚓ ${r.name}</b><small>${r.who} · leva carga e Caminhantes entre as ilhas</small>${dest.map((I) => `<div class="nvrow"><div><b>${I.name}</b><small>Nível ${I.lo}–${I.hi}</small></div><button data-rt="${I.id}" class="gold" ${lv < ROUTE_LV ? 'disabled' : ''}>${lv < ROUTE_LV ? `nível ${ROUTE_LV}+` : `${fmt(ROUTE_PRICE)} 🪙`}</button></div>`).join('')}</div>`; }).join('');
    return rows ? `<div class="nvroutes"><h3>Rotas comerciais</h3>${lv < ROUTE_LV ? `<p class="nvtxt">Os capitães dos comboios só embarcam Caminhantes de nível ${ROUTE_LV} ou mais.</p>` : ''}${rows}</div>` : ''; }
  const close = () => { openAt = null; el.style.display = 'none'; };
  const backName = () => { try { return docks.find((q) => q.id === localStorage.getItem(KEY_FROM))?.name ?? 'Porto Caldeira'; } catch { return 'Porto Caldeira'; } };
  function sail(to: Dock, msg: string) { K.withFade(() => { K.state.fx = to.x + 0.5; K.state.fy = to.y + 0.5; K.state.path = []; K.objs.update(K.state.fx * T, K.state.fy * T, true); K.heroY = heightAt(K.state.fx * T, K.state.fy * T); K.camX = K.state.fx * T; K.camZ = K.state.fy * T; K.camY = K.heroY; K.game.logMsg(msg, '#8ad0ff'); }, '⛴ A viagem pelo Mar de Karmika…'); }
  el.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-x]')) { close(); return; }
    if (t.closest('[data-back]') && openAt) { const to = docks.find((q) => q.id === localStorage.getItem(KEY_FROM)) ?? docks.find((q) => q.id === 'c:Porto Caldeira'); close(); if (to) sail(to, `⛴ O navio a vapor atraca em ${to.name}. Bem-vindo de volta ao continente.`); return; }
    const rt = (t.closest('[data-rt]') as HTMLElement | null)?.dataset.rt; if (rt && openAt) { if (K.game.st.lvl < ROUTE_LV) return; if (K.game.st.gold < ROUTE_PRICE) { K.game.logMsg(`🎟 O comboio cobra ${fmt(ROUTE_PRICE)} de ouro.`, '#ff9a8a'); return; } const to = docks.find((q) => q.isle === +rt); if (!to) return;
      K.game.st.gold -= ROUTE_PRICE; K.audio?.coin?.(); if (!openAt.isle) try { localStorage.setItem(KEY_FROM, openAt.id); } catch { /* */ } close(); sail(to, `⚓ O comboio mercante ancora diante de ${to.name}, descarrega a carga e segue viagem.`); return; }
    const go = (t.closest('[data-go]') as HTMLElement | null)?.dataset.go; if (go && openAt) { if (!sched(+go).open) { K.game.logMsg(`⏳ O navio para lá só sai às ${sched(+go).at}.`, '#ff9a8a'); return; } if (K.game.st.gold < PRICE) { K.game.logMsg(`🎟 A passagem custa ${fmt(PRICE)} de ouro.`, '#ff9a8a'); return; } const to = docks.find((q) => q.isle === +go); if (!to) return;
      K.game.st.gold -= PRICE; K.audio?.coin?.(); try { localStorage.setItem(KEY_FROM, openAt.id); } catch { /* */ } close(); sail(to, `⛴ Depois de dias de mar, o navio lança âncora diante de ${to.name}. Cuidado: aqui tudo é nível ${ISLES.find((q) => q.id === to.isle)?.lo}+.`); } });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && openAt) close(); });
  /** o que o herói pode fazer perto de um cais */
  function interact(hx: number, hz: number): { d: number; label: string; act: () => void } | null {
    let best: Dock | null = null, bd = 1e9; for (const d of docks) { const dd = Math.hypot((d.x + 0.5) * T - hx, (d.y + 0.5) * T - hz); if (dd < bd) { bd = dd; best = d; } }
    if (!best || bd > 7) return null; const d = best; return { d: bd, label: d.isle ? `E — Navio da Companhia: voltar para ${backName()}` : `E — Navio da Companhia: passagens para as ilhas (${fmt(PRICE)})`, act: () => open(d) };
  }
  /* os comboios navegam de verdade: dois navios mercantes (NPC) indo e voltando entre o continente e as ilhas, por fora da costa */
  /* 09/11 (Erling: "que bug é esse de uma embarcação andando no meio do mapa? ela só vai pelo mar"): o comboio não corta mais em linha reta;
     segue uma rota achada só por água (busca em largura na grade de água, de 2 em 2 tiles). Se não há caminho por água (cais de lago, como
     Lithendel), não há comboio. */
  const conv: { g: THREE.Group; pts: THREE.Vector3[]; cum: number[]; len: number; t: number; sp: number }[] = [];
  const M = K.city.map, H = M.length, W = M[0]?.length ?? 0, S = 2, GW = Math.ceil(W / S), GH = Math.ceil(H / S);
  const wet = (gx: number, gy: number) => { const x = gx * S, y = gy * S; return M[y]?.[x] === 'water' && M[y + 1]?.[x + 1] === 'water'; };
  const snap = (x: number, y: number) => { const gx0 = Math.round(x / S), gy0 = Math.round(y / S); for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (wet(gx0 + dx, gy0 + dy)) return [gx0 + dx, gy0 + dy]; return null; };
  function seaPath(a: Dock, b: Dock): THREE.Vector3[] | null { const A = snap(a.sx, a.sy), B = snap(b.sx, b.sy); if (!A || !B) return null;
    const par = new Int32Array(GW * GH).fill(-1), q = new Int32Array(GW * GH); let h = 0, t2 = 0; const s0 = A[1] * GW + A[0], goal = B[1] * GW + B[0]; par[s0] = s0; q[t2++] = s0;
    while (h < t2) { const c = q[h++]; if (c === goal) break; const cx = c % GW, cy = (c / GW) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue; const n = ny * GW + nx; if (par[n] >= 0 || !wet(nx, ny)) continue; par[n] = c; q[t2++] = n; } }
    if (par[goal] < 0) return null; const raw: THREE.Vector3[] = []; for (let c = goal; ; c = par[c]) { raw.push(new THREE.Vector3(((c % GW) * S + 1) * T, 0, (((c / GW) | 0) * S + 1) * T)); if (c === s0) break; } raw.reverse();
    const pts = raw.filter((_, i) => i % 4 === 0 || i === raw.length - 1); return pts.length > 1 ? new THREE.CatmullRomCurve3(pts).getSpacedPoints(Math.max(8, pts.length * 3)) : null; }
  { const cont = docks.filter((q) => !q.isle && q.name !== 'Lithendel'), isl = docks.filter((q) => q.isle); for (let i = 0; i < Math.min(4, isl.length); i++) { const a = cont[i % Math.max(1, cont.length)], b = isl[i]; if (!a || !b) continue;
    const pts = seaPath(a, b); if (!pts) continue; const cum = [0]; for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + pts[k].distanceTo(pts[k - 1]));
    const g = mkShip(90 + i); g.scale.setScalar(0.8); K.scene.add(g); const len = cum[cum.length - 1]; conv.push({ g, pts, cum, len, t: i * 0.27, sp: 6 / Math.max(1, len) }); } }
  let tt = 0;
  function update(dt: number) { tt += dt;
    for (const c of conv) { c.t = (c.t + dt * c.sp) % 2; const back = c.t >= 1, f = back ? 2 - c.t : c.t, d = f * c.len; let k = 1; while (k < c.cum.length - 1 && c.cum[k] < d) k++;
      const p0 = c.pts[k - 1], p1 = c.pts[k], u = (d - c.cum[k - 1]) / Math.max(1e-6, c.cum[k] - c.cum[k - 1]), x = p0.x + (p1.x - p0.x) * u, z = p0.z + (p1.z - p0.z) * u;
      const near = Math.abs(x - K.camX) < 260 && Math.abs(z - K.camZ) < 260; c.g.visible = near; if (!near) continue;
      c.g.position.set(x, WL - 0.6 + Math.sin(tt * 0.7 + c.t * 9) * 0.18, z); const hx = (p1.x - p0.x) * (back ? -1 : 1), hz = (p1.z - p0.z) * (back ? -1 : 1); c.g.rotation.y = Math.atan2(hx, hz) + Math.PI / 2; c.g.updateMatrixWorld(true); } for (const s of ships) { const near = Math.abs(s.g.position.x - K.camX) < 220 && Math.abs(s.g.position.z - K.camZ) < 220; s.g.visible = near; s.smoke.visible = near; if (!near) continue;
      s.g.position.y = WL - 0.6 + Math.sin(tt * 0.7 + s.g.userData.seed) * 0.18; s.g.rotation.z = Math.sin(tt * 0.5 + s.g.userData.seed) * 0.015; s.g.rotation.x = Math.sin(tt * 0.43) * 0.01;
      const a = s.smoke.geometry.attributes.position as THREE.BufferAttribute; for (let i = 0; i < a.count; i++) { const f = ((tt * 0.25 + i / a.count) % 1), stack = i % 3, lx = [-2, 2.2, 6.4][stack], h = [9, 10, 8.5][stack]; const c = Math.cos(s.g.rotation.y), sn = Math.sin(s.g.rotation.y);
        const px = lx + f * 3, py = 2.6 + h + f * 7, pz = Math.sin(i * 1.7) * f * 1.5; a.setXYZ(i, s.g.position.x + px * c + pz * sn, s.g.position.y + py, s.g.position.z - px * sn + pz * c); } a.needsUpdate = true; } }
  return { interact, update, close, get open() { return !!openAt; } };
}
