/* CACHOEIRAS (25/10): onde um rio encosta num paredão de pedra alto, a água despenca — véu branco correndo, espuma no pé,
   névoa subindo, pedras molhadas em volta — e o som de queda que cresce quando você chega perto.
   Achadas sozinhas no mapa: água com terra 5 m ou mais acima, a até 4 tiles. Até 12 no mundo, bem espalhadas. */
import * as THREE from 'three';

const NAMES = ['Véu de Marghar', 'Cachoeira do Corvo', 'Queda das Três Irmãs', 'Salto do Lobo', 'Cachoeira da Neblina', 'Lágrimas de Hrefna', 'Queda do Ferreiro', 'Salto Branco', 'Cachoeira do Eco', 'Véu das Fadas', 'Queda de Odin', 'Cachoeira Esquecida'];
export function createFalls(o: { scene: THREE.Scene; map: string[][]; T: number; WL: number; height(x: number, z: number): number; pois: { name: string; x: number; y: number; biome: string }[]; spawn(x: number, y: number, z: number, p: Record<string, number>): void }) {
  const { map, T, WL } = o, H = map.length, W = map[0].length;
  const cands: { s: number; bx: number; by: number; tx: number; ty: number; h: number }[] = [];
  for (let y = 10; y < H - 10; y += 2) for (let x = 10; x < W - 10; x += 2) { if (map[y][x] !== 'water' || o.height((x + 0.5) * T, (y + 0.5) * T) > WL - 0.4) continue; /* só água que se vê (lago e rio de verdade, longe da borda do mapa) */
    for (let a = 0; a < 8; a++) { const dx = Math.round(Math.cos(a / 8 * 6.283)), dy = Math.round(Math.sin(a / 8 * 6.283));
      for (let d = 2; d <= 3; d++) { const lx = x + dx * d, ly = y + dy * d, t = map[ly]?.[lx]; if (!t || t === 'water' || t === 'wall') continue; const h = o.height((lx + 0.5) * T, (ly + 0.5) * T) - WL;
        if (h > 4 && h < 20 && o.height((x + dx * (d - 1) + 0.5) * T, (y + dy * (d - 1) + 0.5) * T) < WL + 1.5) cands.push({ s: h - d * 0.8, bx: x + dx * (d - 1.5), by: y + dy * (d - 1.5), tx: lx, ty: ly, h }); break; } } }
  cands.sort((a, b) => b.s - a.s);
  const picked: typeof cands = []; for (const c of cands) { if (picked.length >= 12) break; if (picked.some((p) => Math.hypot(p.bx - c.bx, p.by - c.by) < 70)) continue; picked.push(c); }
  /* a textura do véu: listras verticais que correm para baixo (o offset anda a cada quadro) */
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; const g = cv.getContext('2d')!; g.fillStyle = 'rgba(190,225,255,0.55)'; g.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 70; i++) { const x = Math.random() * 64, w = 1 + Math.random() * 3, l = 10 + Math.random() * 50, y = Math.random() * 128; g.fillStyle = `rgba(255,255,255,${0.35 + Math.random() * 0.5})`; g.fillRect(x, y, w, l); g.fillRect(x, y - 128, w, l); }
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
  const veilM = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide });
  const foamM = new THREE.MeshBasicMaterial({ color: 0xf4fbff, transparent: true, opacity: 0.75, depthWrite: false });
  const falls: { x: number; z: number; top: THREE.Vector3; bot: THREE.Vector3; foam: THREE.Mesh; tex: THREE.Texture; layers: THREE.Texture[]; name: string }[] = [];
  /* 07/11 (Erling, foto de Skógafoss: "água de cachoeira, o jeito certo"): a água sai de um rio no alto, passa por uma borda de pedra reta e
     cai em PRUMO — uma cortina larga, em camadas que correm em velocidades diferentes e se abrem embaixo —, com um poço escuro e uma
     nuvem grossa de névoa no pé; as paredes da garganta são de pedra escura molhada com musgo por cima */
  const mistTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d')!; const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(235,245,255,.85)'); gr.addColorStop(0.5, 'rgba(225,238,250,.35)'); gr.addColorStop(1, 'rgba(225,238,250,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const wetM = new THREE.MeshToonMaterial({ color: 0x3a3e42 }), mossM = new THREE.MeshToonMaterial({ color: 0x4e7a2a }), poolM = new THREE.MeshBasicMaterial({ color: 0x1a3a48, transparent: true, opacity: 0.75, depthWrite: false });
  const mists: { sp: THREE.Sprite; ph: number; base: number }[][] = [];
  picked.forEach((c, i) => {
    const bot = new THREE.Vector3((c.bx + 0.5) * T, WL + 0.05, (c.by + 0.5) * T), top0 = new THREE.Vector3((c.tx + 0.5) * T, WL + c.h, (c.ty + 0.5) * T);
    const hor = new THREE.Vector3(top0.x - bot.x, 0, top0.z - bot.z).normalize(), side = new THREE.Vector3(-hor.z, 0, hor.x), up = new THREE.Vector3(0, 1, 0), nrm = hor.clone().negate();
    /* a borda: um pouco à frente do alto, para a cortina cair reta até a água */
    const lipP = top0.clone().addScaledVector(hor, -1.2), drop = lipP.y - WL, top = lipP;
    const grp = new THREE.Group(); o.scene.add(grp);
    const wdt = 5 + (i % 3) * 1.2, t2 = tex.clone(); t2.needsUpdate = true; t2.repeat.set(wdt / 3, drop / 6);
    const layers: THREE.Texture[] = [t2];
    for (const [off, k, op] of [[0.15, 1, 0.92], [0.45, 0.82, 0.7], [-0.1, 0.62, 0.55]] as const) { const tl = off === 0.15 ? t2 : tex.clone(); tl.needsUpdate = true; tl.repeat.set(wdt * k / 3, drop / (5 + k * 2)); if (tl !== t2) layers.push(tl);
      const vm = veilM.clone(); vm.map = tl; vm.opacity = op; const pl = new THREE.Mesh(new THREE.PlaneGeometry(wdt * k, drop, 6, 10), vm);
      pl.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, up, nrm)); pl.position.copy(lipP).addScaledVector(up, -drop / 2).addScaledVector(nrm, off);
      /* a água sai da borda com um pouco de arco e se abre ao cair */ const pa = pl.geometry.attributes.position as THREE.BufferAttribute; for (let v = 0; v < pa.count; v++) { const yy = pa.getY(v) / drop + 0.5, fall = 1 - yy; pa.setX(v, pa.getX(v) * (1 + 0.22 * fall)); pa.setZ(v, Math.sin(Math.min(1, yy * 6) * Math.PI / 2) * 0 + (1 - Math.pow(yy, 0.5)) * 0.9 + (yy > 0.93 ? (yy - 0.93) * 6 : 0)); } pa.needsUpdate = true;
      grp.add(pl); }
    /* o rio chegando na borda */ { const vm = veilM.clone(); vm.map = layers[0]; const r = new THREE.Mesh(new THREE.PlaneGeometry(wdt * 0.95, 4.5), vm); r.rotation.x = -Math.PI / 2; r.quaternion.premultiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), hor.clone().negate().applyAxisAngle(up, 0))); r.position.copy(lipP).addScaledVector(hor, 2.2).setY(lipP.y + 0.08); grp.add(r); }
    const lip = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, wdt - 0.4, 4, 8), foamM); lip.rotation.z = Math.PI / 2; lip.quaternion.premultiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), side)); lip.position.copy(lipP).addScaledVector(nrm, 0.25); grp.add(lip);
    /* as paredes da garganta: rocha escura molhada empilhada dos dois lados, com musgo no alto */
    for (const sx of [-1, 1]) for (let k = 0; k < Math.ceil(drop / 1.6) + 1; k++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + ((k * 7 + i) % 3) * 0.35, 0), wetM); const y = WL + k * 1.6 - 0.3;
      r.position.copy(lipP).setY(y).addScaledVector(side, sx * (wdt * 0.5 + 1.1 + ((k * 3) % 2) * 0.5)).addScaledVector(hor, 0.6 + (k % 2) * 0.5); r.rotation.set(k, sx * k, k * 0.5); r.castShadow = true; grp.add(r);
      if (y > lipP.y - 2.5) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 0), mossM); m.scale.set(1.3, 0.45, 1.2); m.position.copy(r.position).setY(y + 0.9); grp.add(m); } }
    for (let k = 0; k < 5; k++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 0), wetM); r.scale.set(1.3, 0.7, 1); r.position.copy(lipP).addScaledVector(side, (k / 4 - 0.5) * wdt).addScaledVector(hor, 0.7).setY(lipP.y - 0.55); grp.add(r); }
    /* o poço escuro e a espuma */ const pool = new THREE.Mesh(new THREE.CircleGeometry(wdt * 1.25, 22), poolM); pool.rotation.x = -Math.PI / 2; pool.position.copy(lipP).setY(WL + 0.04).addScaledVector(nrm, 1.5); grp.add(pool);
    const foam = new THREE.Mesh(new THREE.RingGeometry(0.1, wdt * 0.8, 20), foamM); foam.rotation.x = -Math.PI / 2; foam.position.copy(lipP).setY(WL + 0.09).addScaledVector(nrm, 0.8); grp.add(foam);
    /* a nuvem de névoa no pé */ const ms: { sp: THREE.Sprite; ph: number; base: number }[] = [];
    for (let k = 0; k < 7; k++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex, transparent: true, depthWrite: false, opacity: 0.4 })); const base = wdt * (1.1 + (k % 3) * 0.35); sp.scale.set(base, base * 0.75, 1);
      sp.position.copy(lipP).setY(WL + 0.8 + (k % 3) * 1.1).addScaledVector(side, (k / 6 - 0.5) * wdt * 1.4).addScaledVector(nrm, 0.6 + (k % 2) * 1.4); grp.add(sp); ms.push({ sp, ph: k * 1.3 + i, base }); }
    mists.push(ms);
    void top; const name = NAMES[i % NAMES.length]; falls.push({ x: bot.x, z: bot.z, top: lipP, bot: lipP.clone().setY(WL + 0.05).addScaledVector(nrm, 0.8), foam, tex: t2, layers, name } as typeof falls[number]); o.pois.push({ name, x: c.bx, y: c.by, biome: 'meadow' });
  });
  let tt = 0;
  /** anima os véus e a espuma; devolve a distância até a cachoeira mais perto (para o som) */
  function update(dt: number, hero: THREE.Vector3) { tt += dt; let best = 1e9;
    for (const f of falls) { const d = Math.hypot(f.x - hero.x, f.z - hero.z); if (d < best) best = d; if (d > 90) continue;
      f.layers.forEach((tl, k) => { tl.offset.y += dt * (1.7 + k * 0.6); }); const s = 1 + Math.sin(tt * 3 + f.x) * 0.06; f.foam.scale.set(s, s, 1);
      for (const m of mists[falls.indexOf(f)] ?? []) { const q = 1 + Math.sin(tt * 0.8 + m.ph) * 0.12; m.sp.scale.set(m.base * q, m.base * 0.75 * q, 1); (m.sp.material as THREE.SpriteMaterial).opacity = 0.32 + Math.sin(tt * 1.1 + m.ph) * 0.08; }
      if (d < 45 && Math.random() < dt * 14) { const a = Math.random() * 6.283, r = Math.random() * 2; o.spawn(f.bot.x + Math.cos(a) * r, f.bot.y + 0.2, f.bot.z + Math.sin(a) * r, { vx: Math.cos(a) * 0.6, vy: 0.8 + Math.random() * 1.2, vz: Math.sin(a) * 0.6, life: 1.6, s0: 0.5, s1: 1.6, c0: 0xffffff, c1: 0xc8e4ff, a: 0.35, drag: 0.8 }); } }
    return best; }
  return { update, list: falls };
}
