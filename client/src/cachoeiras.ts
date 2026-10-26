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
  const rockM = new THREE.MeshToonMaterial({ color: 0x5a5e62 });
  const falls: { x: number; z: number; top: THREE.Vector3; bot: THREE.Vector3; foam: THREE.Mesh; tex: THREE.Texture; name: string }[] = [];
  picked.forEach((c, i) => {
    const bot = new THREE.Vector3((c.bx + 0.5) * T, WL + 0.05, (c.by + 0.5) * T), top = new THREE.Vector3((c.tx + 0.5) * T, WL + c.h, (c.ty + 0.5) * T);
    const up = top.clone().sub(bot), len = up.length(); up.normalize(); const hor = new THREE.Vector3(top.x - bot.x, 0, top.z - bot.z).normalize(), side = new THREE.Vector3(-hor.z, 0, hor.x), nrm = side.clone().cross(up).normalize();
    const grp = new THREE.Group(); o.scene.add(grp);
    const wdt = 3.2 + (i % 3) * 0.9, t2 = tex.clone(); t2.needsUpdate = true; t2.repeat.set(wdt / 3, len / 6); const vm = veilM.clone(); vm.map = t2;
    for (const [off, k] of [[0, 1], [0.25, 0.8]] as const) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(wdt * k, len, 1, 8), vm); const m = new THREE.Matrix4().makeBasis(side, up, nrm); pl.quaternion.setFromRotationMatrix(m); pl.position.copy(bot).add(top).multiplyScalar(0.5).addScaledVector(nrm, off * (k < 1 ? 1 : 0)); pl.userData.keep = true; grp.add(pl);
      /* a curva do véu: a borda de cima avança um pouco antes de cair */ const pa = pl.geometry.attributes.position as THREE.BufferAttribute; for (let v = 0; v < pa.count; v++) { const yy = pa.getY(v) / len + 0.5; pa.setZ(v, Math.pow(yy, 3) * 0.9); } pa.needsUpdate = true; }
    const lip = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, wdt - 0.6, 4, 8), foamM); lip.rotation.z = Math.PI / 2; lip.quaternion.premultiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), side)); lip.position.copy(top).addScaledVector(up, -0.2); grp.add(lip);
    const foam = new THREE.Mesh(new THREE.CircleGeometry(wdt * 0.75, 18), foamM); foam.rotation.x = -Math.PI / 2; foam.position.copy(bot).setY(WL + 0.08); grp.add(foam);
    for (let k = 0; k < 7; k++) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.9, 0), rockM); const a = (k / 7) * Math.PI + Math.atan2(side.z, side.x); r.position.set(bot.x + Math.cos(a) * (wdt * 0.9 + Math.random()), WL + 0.2, bot.z + Math.sin(a) * (wdt * 0.9 + Math.random())); r.scale.y = 0.6; r.castShadow = true; grp.add(r); }
    const name = NAMES[i % NAMES.length]; falls.push({ x: bot.x, z: bot.z, top, bot, foam, tex: t2, name }); o.pois.push({ name, x: c.bx, y: c.by, biome: 'meadow' });
  });
  let tt = 0;
  /** anima os véus e a espuma; devolve a distância até a cachoeira mais perto (para o som) */
  function update(dt: number, hero: THREE.Vector3) { tt += dt; let best = 1e9;
    for (const f of falls) { const d = Math.hypot(f.x - hero.x, f.z - hero.z); if (d < best) best = d; if (d > 90) continue;
      f.tex.offset.y += dt * 1.6; const s = 1 + Math.sin(tt * 3 + f.x) * 0.06; f.foam.scale.set(s, s, 1);
      if (d < 45 && Math.random() < dt * 14) { const a = Math.random() * 6.283, r = Math.random() * 2; o.spawn(f.bot.x + Math.cos(a) * r, f.bot.y + 0.2, f.bot.z + Math.sin(a) * r, { vx: Math.cos(a) * 0.6, vy: 0.8 + Math.random() * 1.2, vz: Math.sin(a) * 0.6, life: 1.6, s0: 0.5, s1: 1.6, c0: 0xffffff, c1: 0xc8e4ff, a: 0.35, drag: 0.8 }); } }
    return best; }
  return { update, list: falls };
}
