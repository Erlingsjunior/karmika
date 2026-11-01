/* ---------- ESPADAS E ESCUDOS DE REFERÊNCIA (01/11/2026, Erling) ----------
   Piloto feito olhando as pranchas de arte "karmika stuffs": a imagem 49 (seis espadas longas) e a 51 (seis escudos).
   Cada peça é montada com perfis 2D extrudados, nas cores da referência. Quando os GLB do Tripo chegarem, entram no lugar;
   até lá estas versões dão a escala e o encaixe na mão. Lâmina sempre ao longo de −Y a partir da empunhadura (y=0). */
import * as THREE from 'three';

export interface SwordCtx {
  mk: (geo: THREE.BufferGeometry, color: number, w?: number, mat?: THREE.Material) => THREE.Mesh;
  metal: (rar: string, base?: number, k?: number) => THREE.Material;
  toon: (c: number, o?: THREE.MeshToonMaterialParameters) => THREE.Material;
  glow: number; rar: string;
}
/** perfil: metade direita da lâmina, de cima (y=0, junto da guarda) até a ponta (y negativo); espelha para a esquerda */
function bladeGeo(half: [number, number][], depth: number, taperZ = true) {
  const s = new THREE.Shape(); s.moveTo(0, half[0][1]);
  for (const [x, y] of half) s.lineTo(x, y); for (let i = half.length - 1; i >= 0; i--) s.lineTo(-half[i][0], half[i][1]); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: taperZ, bevelThickness: depth * 0.9, bevelSize: Math.min(0.012, depth * 1.2), bevelSegments: 1, curveSegments: 4 });
  g.translate(0, 0, -depth / 2); return g;
}
/** cabo enrolado: cilindro com anéis finos (o enrolado de couro/arame) */
function wrapGrip(sw: THREE.Group, c: SwordCtx, col: number, L: number, r = 0.016, turns = 7, wire?: number) {
  const grip = c.mk(new THREE.CylinderGeometry(r, r * 1.05, L, 8), col, 0.003); grip.position.y = L / 2 - 0.02; sw.add(grip);
  for (let i = 0; i < turns; i++) { const ring = c.mk(new THREE.TorusGeometry(r + 0.002, 0.0035, 4, 10), wire ?? col, 0, wire ? c.metal(c.rar, wire, 0.2) : undefined); ring.rotation.x = Math.PI / 2; ring.position.y = -0.01 + (i + 0.5) * (L / turns); sw.add(ring); }
}
export const REF_SWORDS = ['Espada Longa', 'Espada Nórdica', 'Espadão Anão', 'Lâmina Élfica', 'Cimitarra', 'Espada de Espinhos'] as const;
export type RefSword = (typeof REF_SWORDS)[number];
/** monta a espada no grupo (que já tem a empunhadura simples e o pomo padrão: removemos e refazemos). Devolve o comprimento da lâmina */
export function buildRefSword(sw: THREE.Group, base: RefSword, c: SwordCtx): number {
  for (const o of [...sw.children]) sw.remove(o);
  const steel = 0xc9ced6, GL = c.glow;
  if (base === 'Espada Longa') { // 49.1: lâmina reta de dois gumes, canaleta, guarda reta de aço, cabo de couro marrom, pomo redondo
    const L = 0.86; sw.add(c.mk(bladeGeo([[0.035, 0], [0.034, -L * 0.72], [0.026, -L * 0.9], [0, -L]], 0.008), steel, 0.004, c.metal(c.rar, steel)));
    const fl = c.mk(new THREE.BoxGeometry(0.009, L * 0.62, 0.011), 0x8a929e, 0); fl.position.y = -L * 0.36; sw.add(fl);
    const gd = c.mk(new THREE.BoxGeometry(0.2, 0.022, 0.03), 0x6e747c, 0.004, c.metal(c.rar, 0x6e747c)); gd.position.y = 0.0; sw.add(gd);
    wrapGrip(sw, c, 0x5b3a22, 0.19, 0.016, 8);
    const pm = c.mk(new THREE.CylinderGeometry(0.03, 0.03, 0.018, 10), GL || 0x7a8088, 0.003, c.metal(c.rar, 0x7a8088)); pm.rotation.x = Math.PI / 2; pm.position.y = 0.19; sw.add(pm);
    return L;
  }
  if (base === 'Espada Nórdica') { // 49.2: lâmina longa com canaleta funda, quilhões dourados curvados para a lâmina, cabo escuro com arame de ouro, pomo largo gravado
    const L = 0.9; sw.add(c.mk(bladeGeo([[0.032, 0], [0.03, -L * 0.8], [0.02, -L * 0.93], [0, -L]], 0.008), steel, 0.004, c.metal(c.rar, steel)));
    const fl = c.mk(new THREE.BoxGeometry(0.008, L * 0.7, 0.012), 0x7a828e, 0); fl.position.y = -L * 0.4; sw.add(fl);
    for (const sx of [-1, 1]) { const q = c.mk(new THREE.TorusGeometry(0.07, 0.009, 5, 10, 0.9), 0xd0aa50, 0.003, c.metal(c.rar, 0xd0aa50, 0.2)); q.position.set(sx * 0.055, 0.045, 0); q.rotation.z = sx > 0 ? Math.PI + 0.35 : -0.35 - 0.9; sw.add(q); }
    wrapGrip(sw, c, 0x2a1e14, 0.2, 0.015, 6, 0xd0aa50);
    const pm = c.mk(new THREE.CylinderGeometry(0.038, 0.038, 0.02, 12), GL || 0xb8b4a8, 0.003, c.metal(c.rar, 0xb8b4a8)); pm.rotation.x = Math.PI / 2; pm.position.y = 0.21; sw.add(pm);
    const knot = c.mk(new THREE.TorusGeometry(0.02, 0.004, 4, 12), 0x6a6458, 0); knot.position.set(0, 0.21, 0.012); sw.add(knot);
    return L;
  }
  if (base === 'Espadão Anão') { // 49.3: lâmina larga e chata de ponta quadrada, aço escuro com duas linhas de latão, guarda quadrada, cabo com rebites, pomo em sino
    const L = 0.98; sw.add(c.mk(bladeGeo([[0.052, 0], [0.052, -L * 0.9], [0.036, -L * 0.97], [0.02, -L]], 0.012, false), 0x6a7078, 0.005, c.metal(c.rar, 0x6a7078)));
    for (const sx of [-1, 1]) { const ln = c.mk(new THREE.BoxGeometry(0.004, L * 0.84, 0.014), 0xc8963c, 0, c.metal(c.rar, 0xc8963c, 0.2)); ln.position.set(sx * 0.011, -L * 0.46, 0); sw.add(ln); }
    const gd = c.mk(new THREE.BoxGeometry(0.15, 0.04, 0.05), 0x50565e, 0.004, c.metal(c.rar, 0x50565e)); gd.position.y = 0.0; sw.add(gd);
    const grip = c.mk(new THREE.CylinderGeometry(0.018, 0.02, 0.24, 8), 0x2e2622, 0.003); grip.position.y = 0.13; sw.add(grip);
    for (let i = 0; i < 4; i++) { const rv = c.mk(new THREE.SphereGeometry(0.005, 5, 4), 0xb8b4a8, 0); rv.position.set(0, 0.04 + i * 0.055, 0.019); sw.add(rv); }
    const pm = c.mk(new THREE.CylinderGeometry(0.04, 0.022, 0.03, 10), GL || 0x7a8088, 0.003, c.metal(c.rar, 0x7a8088)); pm.position.y = 0.265; sw.add(pm);
    return L;
  }
  if (base === 'Lâmina Élfica') { // 49.4: lâmina em folha marfim com nervura, guarda de folhas entrelaçadas, cabo verde enrolado, pomo em folha
    const L = 0.92, ivory = 0xe8e2cc; sw.add(c.mk(bladeGeo([[0.012, 0], [0.03, -L * 0.3], [0.036, -L * 0.6], [0.024, -L * 0.86], [0, -L]], 0.009), ivory, 0.004, c.metal(c.rar, ivory)));
    const vein = c.mk(new THREE.BoxGeometry(0.005, L * 0.8, 0.012), 0xbdb6a0, 0); vein.position.y = -L * 0.45; sw.add(vein);
    for (const sx of [-1, 1]) { const leaf = c.mk(new THREE.SphereGeometry(0.03, 7, 5), 0xd8d2bc, 0.003, c.metal(c.rar, 0xd8d2bc)); leaf.scale.set(1.4, 0.5, 0.4); leaf.position.set(sx * 0.03, 0.01, 0); leaf.rotation.z = sx * 0.6; sw.add(leaf); }
    wrapGrip(sw, c, 0x3e5a30, 0.19, 0.014, 9);
    const pm = c.mk(new THREE.SphereGeometry(0.022, 7, 5), GL || 0xd8d2bc, 0.003, c.metal(c.rar, 0xd8d2bc)); pm.scale.set(0.6, 1.3, 0.6); pm.position.y = 0.2; sw.add(pm);
    return L;
  }
  if (base === 'Cimitarra') { // 49.5: lâmina curva que alarga na ponta, guarda dourada com gancho, cabo vermelho enrolado, pomo em gancho
    const L = 0.86; const half: [number, number][] = []; for (let i = 0; i <= 8; i++) { const t = i / 8; half.push([0.028 + 0.02 * Math.sin(t * Math.PI) + (t > 0.7 ? (t - 0.7) * 0.05 : 0), -t * L]); } half[8] = [0.004, -L];
    const bl = c.mk(bladeGeo(half, 0.008), steel, 0.004, c.metal(c.rar, steel)); // a curvatura: a lâmina inclina e se desloca para o lado de corte
    bl.rotation.z = -0.12; bl.position.x = -0.02; sw.add(bl);
    const gd = c.mk(new THREE.BoxGeometry(0.12, 0.024, 0.03), 0xd0aa50, 0.003, c.metal(c.rar, 0xd0aa50, 0.2)); sw.add(gd);
    const hook = c.mk(new THREE.TorusGeometry(0.03, 0.008, 5, 10, Math.PI), 0xd0aa50, 0, c.metal(c.rar, 0xd0aa50, 0.2)); hook.position.set(0.075, 0.0, 0); hook.rotation.z = -Math.PI / 2; sw.add(hook);
    wrapGrip(sw, c, 0x8a1e1e, 0.18, 0.015, 8);
    const pm = c.mk(new THREE.TorusGeometry(0.022, 0.009, 5, 10, Math.PI * 1.2), GL || 0xd0aa50, 0.003, c.metal(c.rar, 0xd0aa50, 0.2)); pm.position.set(0.01, 0.19, 0); pm.rotation.z = 0.4; sw.add(pm);
    return L;
  }
  // 49.6 Espada de Espinhos: lâmina reta de aço escuro com sangue, guarda em ramos de espinho, cabo preto enrolado, pomo em espigão
  const L = 0.92, dark = 0x7a7e88; sw.add(c.mk(bladeGeo([[0.03, 0], [0.03, -L * 0.75], [0.022, -L * 0.9], [0, -L]], 0.008), dark, 0.004, c.metal(c.rar, dark)));
  const blood = c.mk(new THREE.BoxGeometry(0.012, L * 0.3, 0.01), 0x7a0e14, 0, c.toon(0x7a0e14, { emissive: new THREE.Color(0x3a0408) })); blood.position.set(0.006, -L * 0.1, 0); sw.add(blood);
  for (const sx of [-1, 1]) { const br = c.mk(new THREE.TorusGeometry(0.06, 0.007, 4, 10, 1.4), 0x2a2a32, 0.003, c.metal(c.rar, 0x3a3440)); br.position.set(sx * 0.04, 0.0, 0); br.rotation.z = sx > 0 ? -0.2 : Math.PI - 1.2; sw.add(br);
    for (let i = 0; i < 3; i++) { const th = c.mk(new THREE.ConeGeometry(0.006, 0.03, 4), 0x2a2a32, 0); th.position.set(sx * (0.05 + i * 0.025), -0.02 - i * 0.012, 0); th.rotation.z = sx * -0.9; sw.add(th); } }
  wrapGrip(sw, c, 0x1a1a1e, 0.2, 0.015, 7, 0x3a3a44);
  const pm = c.mk(new THREE.ConeGeometry(0.014, 0.06, 6), GL || 0x50545e, 0.003, c.metal(c.rar, 0x50545e)); pm.position.y = 0.23; sw.add(pm);
  return L;
}

/* ---------- rostos dos escudos da imagem 51 (pintados em canvas; o aro, o umbo e os espinhos ficam em 3D no characters.ts) ---------- */
export type RefShieldStyle = 'planks_blue' | 'nordic_red' | 'anvil' | 'elf_leaf' | 'blackcross' | 'spiked';
export const REF_SHIELD_STYLE: Record<string, RefShieldStyle> = { 'Escudo Redondo': 'planks_blue', 'Escudo Nórdico': 'nordic_red', 'Escudo Torre': 'anvil', 'Escudo Élfico': 'elf_leaf', 'Escudo Ogival': 'blackcross', 'Escudo de Espinhos': 'spiked' };
const cache = new Map<string, THREE.CanvasTexture>();
export function refShieldFace(style: RefShieldStyle, seed: number) {
  const key = style + seed, hit = cache.get(key); if (hit) return hit;
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d')!;
  let sd = seed * 7919 + 17; const R = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  const planks = (cols: string[], n = 7, vertical = true) => { const w = S / n; for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; if (vertical) g.fillRect(i * w, 0, w, S); else g.fillRect(0, i * w, S, w);
      for (let k = 0; k < 12; k++) { g.strokeStyle = R() < 0.5 ? '#00000030' : '#ffffff16'; g.lineWidth = 1 + R(); g.beginPath(); const x0 = i * w + R() * w; if (vertical) { g.moveTo(x0, 0); for (let y = 0; y <= S; y += 16) g.lineTo(x0 + Math.sin(y * 0.03 + k) * 3, y); } else { g.moveTo(0, x0); for (let x = 0; x <= S; x += 16) g.lineTo(x, x0 + Math.sin(x * 0.03 + k) * 3); } g.stroke(); }
      g.fillStyle = '#0e0a06'; if (vertical) g.fillRect(i * w, 0, 2, S); else g.fillRect(0, i * w, S, 2); } };
  const scratches = (n: number, col = '#d8b89040') => { g.strokeStyle = col; g.lineWidth = 1.4; for (let i = 0; i < n; i++) { const x = R() * S, y = R() * S, a = R() * 6.28, L = 12 + R() * 30; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); } };
  const cx = S / 2, cy = S / 2;
  if (style === 'planks_blue') { // 51.1: tábuas pintadas de azul desbotado, madeira aparecendo nos riscos
    planks(['#3c5a86', '#34507a', '#42628e', '#2e4a72']); g.globalAlpha = 0.35; planks(['#6a4228', '#5a361f', '#784c2e'], 7); g.globalAlpha = 1; scratches(14, '#c8a87a55');
  } else if (style === 'nordic_red') { // 51.2: quartos vermelho e creme, anel de nós e borda com runas
    planks(['#d8c9a0', '#cfc096', '#e0d2aa']); g.globalAlpha = 0.92; g.fillStyle = '#8e2a22'; for (const q of [0, 2]) { g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, S * 0.5, q * Math.PI / 2 + Math.PI / 4, (q + 1) * Math.PI / 2 + Math.PI / 4); g.closePath(); g.fill(); } g.globalAlpha = 1;
    g.strokeStyle = '#b8862e'; g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, S * 0.42, 0, 7); g.stroke(); g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cy, S * 0.46, 0, 7); g.stroke();
    g.strokeStyle = '#c8a050'; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(cx, cy, S * 0.36, S * 0.11, i * Math.PI / 4, 0, 7); g.stroke(); } // nó entrelaçado
    g.fillStyle = '#2a1a10'; for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; g.save(); g.translate(cx + Math.cos(a) * S * 0.44, cy + Math.sin(a) * S * 0.44); g.rotate(a + Math.PI / 2); g.fillRect(-1.5, -5, 3, 10); if (i % 3 === 0) g.fillRect(-5, -1, 10, 2); g.restore(); } // runas na faixa
    scratches(8);
  } else if (style === 'anvil') { // 51.3: torre de tábuas escuras, cintas de ferro, canto dourado, bigorna no umbo
    planks(['#4a3220', '#3e2a1a', '#54382a', '#46301e'], 5); g.fillStyle = '#2e3136'; g.fillRect(S * 0.42, 0, S * 0.16, S); g.fillRect(0, S * 0.44, S, S * 0.12); g.fillRect(0, 0, S, S * 0.06); g.fillRect(0, S * 0.94, S, S * 0.06);
    g.strokeStyle = '#b8862e'; g.lineWidth = 3; g.strokeRect(S * 0.08, S * 0.1, S * 0.3, S * 0.3); g.strokeRect(S * 0.62, S * 0.1, S * 0.3, S * 0.3); g.strokeRect(S * 0.08, S * 0.6, S * 0.3, S * 0.3); g.strokeRect(S * 0.62, S * 0.6, S * 0.3, S * 0.3);
    g.fillStyle = '#8a7a5a'; for (let k = 0; k < 8; k++) { g.beginPath(); g.arc(S * 0.5, k * S / 8 + 16, 3.5, 0, 7); g.arc(k * S / 8 + 16, S * 0.5, 3.5, 0, 7); g.fill(); }
    g.fillStyle = '#5a5e66'; g.beginPath(); g.arc(cx, cy, 38, 0, 7); g.fill(); g.fillStyle = '#1e2024'; g.beginPath(); g.moveTo(cx - 26, cy - 8); g.lineTo(cx + 20, cy - 8); g.lineTo(cx + 28, cy - 2); g.lineTo(cx + 12, cy + 2); g.lineTo(cx + 10, cy + 14); g.lineTo(cx - 10, cy + 14); g.lineTo(cx - 12, cy + 2); g.lineTo(cx - 26, cy - 2); g.closePath(); g.fill(); // bigorna
    scratches(10, '#ffffff22');
  } else if (style === 'elf_leaf') { // 51.4: marfim com nervuras de folha gravadas, aro dourado fino, gema em folha no centro
    g.fillStyle = '#e4ddc8'; g.fillRect(0, 0, S, S); for (let i = 0; i < 300; i++) { g.fillStyle = R() < 0.5 ? '#ffffff30' : '#b8ae9630'; g.fillRect(R() * S, R() * S, 2, 2); }
    g.strokeStyle = '#b8a880'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, S * 0.08); g.lineTo(cx, S * 0.92); g.stroke(); for (let i = 0; i < 9; i++) { const y = S * 0.16 + i * S * 0.08; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx, y); g.quadraticCurveTo(cx + sx * 30, y - 10, cx + sx * (40 + (i % 3) * 8), y - 30); g.stroke(); } } // nervuras
    g.strokeStyle = '#c8a050'; g.lineWidth = 2; for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(cx + sx * (50 + i * 22), cy + (i - 1) * 50, 10 + i * 3, 0, 7); g.stroke(); } // volutas
    g.fillStyle = '#9ad7a0'; g.beginPath(); g.moveTo(cx, cy - 26); g.quadraticCurveTo(cx + 16, cy, cx, cy + 26); g.quadraticCurveTo(cx - 16, cy, cx, cy - 26); g.fill(); g.strokeStyle = '#c8a050'; g.lineWidth = 2.5; g.stroke(); // gema em folha
  } else if (style === 'blackcross') { // 51.5: aço escuro com cruz branca gasta, rebites no contorno
    g.fillStyle = '#23262c'; g.fillRect(0, 0, S, S); for (let i = 0; i < 160; i++) { const x = R() * S, y = R() * S, r = 3 + R() * 9, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, R() < 0.5 ? '#4a4f56aa' : '#101216aa'); gr.addColorStop(1, '#0000'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    g.fillStyle = '#dcdcd6'; g.globalAlpha = 0.85; g.fillRect(cx - 14, S * 0.08, 28, S * 0.84); g.fillRect(S * 0.12, cy - 36, S * 0.76, 28); g.globalAlpha = 1; scratches(30, '#23262c99');
    g.fillStyle = '#8a8e96'; for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283; g.beginPath(); g.arc(cx + Math.cos(a) * S * 0.45, cy + Math.sin(a) * S * 0.45, 3.5, 0, 7); g.fill(); }
  } else { // 51.6 spiked: redondo escuro com redemoinho gravado e respingos de sangue
    g.fillStyle = '#1e2024'; g.fillRect(0, 0, S, S); g.strokeStyle = '#3a3e46'; g.lineWidth = 4; for (let k = 0; k < 3; k++) { g.beginPath(); for (let a = 0; a < 12; a += 0.15) { const r = 8 + a * 9; g.lineTo(cx + Math.cos(a + k * 2.1) * r, cy + Math.sin(a + k * 2.1) * r * 0.9); } g.stroke(); }
    g.fillStyle = '#7a0e14'; for (let i = 0; i < 14; i++) { const x = cx + (R() - 0.5) * S * 0.8, y = cy + (R() - 0.5) * S * 0.8; g.beginPath(); g.ellipse(x, y, 2 + R() * 6, 3 + R() * 10, R() * 3, 0, 7); g.fill(); }
    g.fillStyle = '#50545e'; g.beginPath(); g.arc(cx, cy, 26, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; cache.set(key, t); return t;
}
