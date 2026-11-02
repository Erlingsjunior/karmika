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
export const REF_SWORDS = ['Espada Longa', 'Espada Nórdica', 'Espadão Anão', 'Lâmina Élfica', 'Cimitarra', 'Espada de Espinhos',
  /* prancha 48 (curtas) e 50 (especiais), 01/11 */ 'Adaga', 'Espada Curta', 'Espada Curta Anã', 'Adaga Élfica', 'Sabre', 'Flamberge', 'Montante', 'Katana', 'Facão', 'Lâmina Serrilhada', 'Espada de Duelo', 'Adaga Fina',
  /* 02/11 (Erling): armas de classe — vampiro (florete), lobisomem (garras), caçador (besta de mão, kunai, adaga de prata) */ 'Florete', 'Garras de Ferro', 'Besta de Mão', 'Kunai', 'Adaga de Prata',
  /* 02/11 (Erling): armas de fogo de uma mão — escudo na outra mão, ou uma em cada mão */ 'Pistola de Latão', 'Escopeta de Cano Duplo'] as const;
export type RefSword = (typeof REF_SWORDS)[number];
/** monta a espada no grupo (que já tem a empunhadura simples e o pomo padrão: removemos e refazemos). Devolve o comprimento da lâmina */
export function buildRefSword(sw: THREE.Group, base: RefSword, c: SwordCtx): number {
  for (const o of [...sw.children]) if ((o as THREE.Mesh).isMesh || (o as THREE.Group).isGroup) sw.remove(o); /* 02/11: os marcadores (ponta e base da arma, Object3D vazios) ficam — sem eles o tiro saía da origem do mundo */
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
  if (base === 'Adaga') { // 48.1: adaga de ferro, lâmina reta com dentes no dorso, guarda pequena, cabo de couro, pomo redondo de ferro
    const L = 0.4; sw.add(c.mk(bladeGeo([[0.024, 0], [0.024, -L * 0.6], [0.018, -L * 0.85], [0, -L]], 0.006), steel, 0.003, c.metal(c.rar, steel)));
    for (let i = 0; i < 4; i++) { const t = c.mk(new THREE.BoxGeometry(0.008, 0.012, 0.007), 0x8a929e, 0); t.position.set(-0.026, -L * 0.2 - i * 0.03, 0); sw.add(t); }
    const gd = c.mk(new THREE.BoxGeometry(0.075, 0.016, 0.022), 0x6e747c, 0.003, c.metal(c.rar, 0x6e747c)); sw.add(gd); wrapGrip(sw, c, 0x5b3a22, 0.12, 0.013, 6);
    const pm = c.mk(new THREE.CylinderGeometry(0.02, 0.02, 0.014, 10), GL || 0x7a8088, 0.003, c.metal(c.rar, 0x7a8088)); pm.rotation.x = Math.PI / 2; pm.position.y = 0.125; sw.add(pm); return L; }
  if (base === 'Espada Curta') { // 48.2: espada curta de dois gumes com canaleta, guarda em arco, cabo de couro, pomo redondo gravado
    const L = 0.6; sw.add(c.mk(bladeGeo([[0.03, 0], [0.029, -L * 0.72], [0.02, -L * 0.9], [0, -L]], 0.007), steel, 0.004, c.metal(c.rar, steel)));
    const fl = c.mk(new THREE.BoxGeometry(0.008, L * 0.6, 0.01), 0x8a929e, 0); fl.position.y = -L * 0.38; sw.add(fl);
    const gd = c.mk(new THREE.TorusGeometry(0.075, 0.009, 5, 12, Math.PI), 0xc8b090, 0.003, c.metal(c.rar, 0xc8b090)); gd.rotation.z = Math.PI; gd.position.y = 0.02; sw.add(gd);
    wrapGrip(sw, c, 0x6a4a2a, 0.15, 0.014, 7); const pm = c.mk(new THREE.CylinderGeometry(0.026, 0.026, 0.016, 10), GL || 0xb8b4a8, 0.003, c.metal(c.rar, 0xb8b4a8)); pm.rotation.x = Math.PI / 2; pm.position.y = 0.15; sw.add(pm); return L; }
  if (base === 'Espada Curta Anã') { // 48.3: lâmina larga de aço escuro com canaleta de latão e dorso quadrado, guarda rebitada, cabo preto com arame, pomo em roda
    const L = 0.64, dk = 0x6a7078; sw.add(c.mk(bladeGeo([[0.04, 0], [0.04, -L * 0.82], [0.03, -L * 0.94], [0.012, -L]], 0.01, false), dk, 0.005, c.metal(c.rar, dk)));
    const ln = c.mk(new THREE.BoxGeometry(0.004, L * 0.78, 0.012), 0xc8963c, 0, c.metal(c.rar, 0xc8963c, 0.2)); ln.position.set(0, -L * 0.42, 0); sw.add(ln);
    const gd = c.mk(new THREE.BoxGeometry(0.11, 0.03, 0.04), 0x50565e, 0.004, c.metal(c.rar, 0x50565e)); sw.add(gd); for (const sx of [-1, 1]) { const rv = c.mk(new THREE.SphereGeometry(0.005, 5, 4), 0xc8963c, 0); rv.position.set(sx * 0.04, 0, 0.021); sw.add(rv); }
    wrapGrip(sw, c, 0x1e1a18, 0.16, 0.015, 6, 0x8a8e96); const pm = c.mk(new THREE.CylinderGeometry(0.028, 0.028, 0.02, 10), GL || 0x7a8088, 0.003, c.metal(c.rar, 0x7a8088)); pm.rotation.x = Math.PI / 2; pm.position.y = 0.165; sw.add(pm); return L; }
  if (base === 'Adaga Élfica') { // 48.4: lâmina em folha marfim, guarda de volutas, cabo verde enrolado, pomo em folha
    const L = 0.5, ivory = 0xe8e2cc; sw.add(c.mk(bladeGeo([[0.01, 0], [0.026, -L * 0.35], [0.028, -L * 0.6], [0.016, -L * 0.85], [0, -L]], 0.007), ivory, 0.003, c.metal(c.rar, ivory)));
    for (const sx of [-1, 1]) { const v = c.mk(new THREE.TorusGeometry(0.018, 0.005, 4, 10, 4.5), 0xd8d2bc, 0.003, c.metal(c.rar, 0xd8d2bc)); v.position.set(sx * 0.026, 0.0, 0); v.rotation.z = sx * 1.2; sw.add(v); }
    wrapGrip(sw, c, 0x3e5a30, 0.13, 0.012, 7); const pm = c.mk(new THREE.SphereGeometry(0.018, 7, 5), GL || 0xd8d2bc, 0.003, c.metal(c.rar, 0xd8d2bc)); pm.scale.set(0.6, 1.3, 0.6); pm.position.y = 0.14; sw.add(pm); return L; }
  if (base === 'Sabre') { // 48.5: lâmina curva de um gume que alarga na ponta, guarda dourada em concha com arco de mão, cabo vermelho enrolado
    const L = 0.72; const half: [number, number][] = []; for (let i = 0; i <= 8; i++) { const t = i / 8; half.push([0.022 + 0.014 * Math.sin(t * Math.PI) + (t > 0.65 ? (t - 0.65) * 0.04 : 0), -t * L]); } half[8] = [0.003, -L];
    const bl = c.mk(bladeGeo(half, 0.007), steel, 0.004, c.metal(c.rar, steel)); bl.rotation.z = -0.1; bl.position.x = -0.015; sw.add(bl);
    const gd = c.mk(new THREE.BoxGeometry(0.09, 0.02, 0.028), 0xd0aa50, 0.003, c.metal(c.rar, 0xd0aa50, 0.2)); sw.add(gd);
    const bow = c.mk(new THREE.TorusGeometry(0.085, 0.007, 5, 12, Math.PI), 0xd0aa50, 0, c.metal(c.rar, 0xd0aa50, 0.2)); bow.position.set(0.045, 0.085, 0); bow.rotation.z = Math.PI / 2; sw.add(bow); // arco de mão: do quilhão ao pomo
    wrapGrip(sw, c, 0x8a1e1e, 0.17, 0.014, 8); const pm = c.mk(new THREE.SphereGeometry(0.02, 7, 5), GL || 0xd0aa50, 0.003, c.metal(c.rar, 0xd0aa50, 0.2)); pm.position.y = 0.175; sw.add(pm); return L; }
  if (base === 'Flamberge') { // 50.1: lâmina ondulada de duas mãos, guarda curva com anéis de proteção, cabo preto longo com anel, pomo em pera
    const L = 1.1; const half: [number, number][] = []; for (let i = 0; i <= 22; i++) { const t = i / 22; half.push([t > 0.92 ? 0.03 * (1 - t) / 0.08 : 0.03 + 0.013 * Math.sin(t * 28) * (1 - t * 0.5), -t * L]); }
    const bl = c.mk(bladeGeo(half, 0.008), steel, 0.004, c.metal(c.rar, steel)); bl.position.y = -0.1; sw.add(bl);
    const ric = c.mk(new THREE.BoxGeometry(0.05, 0.1, 0.012), 0x8a929e, 0.003, c.metal(c.rar, 0x8a929e)); ric.position.y = -0.05; sw.add(ric); // ricasso
    for (const sx of [-1, 1]) { const q = c.mk(new THREE.TorusGeometry(0.1, 0.008, 5, 10, 0.8), 0xb8bcc4, 0.003, c.metal(c.rar, 0xb8bcc4)); q.position.set(sx * 0.07, 0.04, 0); q.rotation.z = sx > 0 ? Math.PI + 0.5 : -0.5 - 0.8; sw.add(q);
      const rg = c.mk(new THREE.TorusGeometry(0.02, 0.005, 4, 10), 0xb8bcc4, 0, c.metal(c.rar, 0xb8bcc4)); rg.position.set(sx * 0.035, -0.07, 0); sw.add(rg); } // anéis do ricasso
    wrapGrip(sw, c, 0x1a1a1e, 0.3, 0.016, 11, 0x50545e); const band = c.mk(new THREE.CylinderGeometry(0.02, 0.02, 0.012, 10), 0xb8bcc4, 0, c.metal(c.rar, 0xb8bcc4)); band.position.y = 0.17; sw.add(band);
    const pm = c.mk(new THREE.SphereGeometry(0.026, 7, 6), GL || 0x8a9098, 0.003, c.metal(c.rar, 0x8a9098)); pm.scale.set(0.9, 1.3, 0.9); pm.position.y = 0.32; sw.add(pm); return L + 0.1; }
  if (base === 'Montante') { // 50.2: montante largo e pesado de ponta arredondada, canaleta funda, guarda reta grossa, cabo de couro longo, pomo em disco
    const L = 1.15; sw.add(c.mk(bladeGeo([[0.055, 0], [0.055, -L * 0.86], [0.04, -L * 0.96], [0.015, -L]], 0.012, false), 0x9aa0a8, 0.005, c.metal(c.rar, 0x9aa0a8)));
    const fl = c.mk(new THREE.BoxGeometry(0.016, L * 0.8, 0.016), 0x5a6068, 0); fl.position.y = -L * 0.45; sw.add(fl);
    const gd = c.mk(new THREE.BoxGeometry(0.19, 0.035, 0.045), 0x6e747c, 0.004, c.metal(c.rar, 0x6e747c)); sw.add(gd); wrapGrip(sw, c, 0x5b3a22, 0.3, 0.018, 12);
    const pm = c.mk(new THREE.CylinderGeometry(0.036, 0.036, 0.024, 12), GL || 0x7a8088, 0.003, c.metal(c.rar, 0x7a8088)); pm.rotation.x = Math.PI / 2; pm.position.y = 0.3; sw.add(pm); return L; }
  if (base === 'Katana') { // 50.4: lâmina curva de um gume com linha de têmpera, guarda redonda (tsuba), cabo longo trançado
    const L = 0.9; const half: [number, number][] = []; for (let i = 0; i <= 8; i++) { const t = i / 8; half.push([0.016 - t * 0.002, -t * L]); } half[8] = [0.003, -L];
    const bl = c.mk(bladeGeo(half, 0.006), 0xd8dce2, 0.003, c.metal(c.rar, 0xd8dce2)); bl.rotation.z = -0.07; bl.position.x = -0.01; sw.add(bl);
    const hamon = c.mk(new THREE.BoxGeometry(0.006, L * 0.85, 0.008), 0xf0f2f4, 0); hamon.position.set(0.01 - L * 0.45 * 0.07, -L * 0.45, 0); hamon.rotation.z = -0.07; sw.add(hamon);
    const tsuba = c.mk(new THREE.CylinderGeometry(0.04, 0.04, 0.008, 12), 0x3a3e46, 0.003, c.metal(c.rar, 0x3a3e46)); sw.add(tsuba);
    const grip = c.mk(new THREE.CylinderGeometry(0.014, 0.015, 0.26, 8), 0x1e1e22, 0.003); grip.position.y = 0.14; sw.add(grip);
    for (let i = 0; i < 9; i++) { const d = c.mk(new THREE.BoxGeometry(0.03, 0.006, 0.006), 0x6a6a72, 0); d.position.set(0, 0.03 + i * 0.027, 0.013); d.rotation.z = i % 2 ? 0.6 : -0.6; sw.add(d); } // trança
    const pm = c.mk(new THREE.CylinderGeometry(0.016, 0.016, 0.012, 8), GL || 0x3a3e46, 0, c.metal(c.rar, 0x3a3e46)); pm.position.y = 0.272; sw.add(pm); return L; }
  if (base === 'Facão') { // 50.5: cutelo largo de um gume com dorso reto e ponta quadrada, guarda em gancho, cabo de madeira rebitado, pomo em gancho de ferro
    const L = 0.8; sw.add(c.mk(bladeGeo([[0.03, 0], [0.034, -L * 0.3], [0.05, -L * 0.75], [0.048, -L * 0.92], [0.02, -L]], 0.008, false), 0xa8adb4, 0.004, c.metal(c.rar, 0xa8adb4)));
    const gd = c.mk(new THREE.BoxGeometry(0.11, 0.022, 0.03), 0x6e747c, 0.003, c.metal(c.rar, 0x6e747c)); sw.add(gd); const hk = c.mk(new THREE.TorusGeometry(0.03, 0.007, 4, 8, Math.PI), 0x6e747c, 0, c.metal(c.rar, 0x6e747c)); hk.position.set(0.06, -0.01, 0); hk.rotation.z = -Math.PI / 2; sw.add(hk);
    const grip = c.mk(new THREE.BoxGeometry(0.03, 0.2, 0.024), 0x8a5a2a, 0.003); grip.position.y = 0.11; sw.add(grip); for (let i = 0; i < 3; i++) { const rv = c.mk(new THREE.SphereGeometry(0.005, 5, 4), 0xb8862e, 0); rv.position.set(0, 0.04 + i * 0.06, 0.013); sw.add(rv); }
    const pm = c.mk(new THREE.TorusGeometry(0.024, 0.008, 4, 8, Math.PI * 1.1), GL || 0x6e747c, 0.003, c.metal(c.rar, 0x6e747c)); pm.position.set(-0.01, 0.22, 0); pm.rotation.z = -0.3; sw.add(pm); return L; }
  if (base === 'Lâmina Serrilhada') { // 50.6: lâmina escura serrilhada com dorso em gancho, guarda com dois chifres de osso, cabo enfaixado em tiras, pomo em espigão
    const L = 0.96, dk = 0x5a5e68; const half: [number, number][] = []; for (let i = 0; i <= 16; i++) { const t = i / 16; half.push([t > 0.9 ? 0.034 * (1 - t) / 0.1 : 0.034 + (i % 2 ? 0.012 : 0) * (1 - t), -t * L]); }
    sw.add(c.mk(bladeGeo(half, 0.009), dk, 0.004, c.metal(c.rar, dk)));
    const gd = c.mk(new THREE.BoxGeometry(0.1, 0.03, 0.036), 0x3a3e46, 0.004, c.metal(c.rar, 0x3a3e46)); sw.add(gd);
    for (const sx of [-1, 1]) { const horn = c.mk(new THREE.ConeGeometry(0.012, 0.08, 6), 0xe8dcc0, 0.003, c.toon(0xe8dcc0)); horn.position.set(sx * 0.065, -0.02, 0); horn.rotation.z = sx * 0.9; sw.add(horn); }
    wrapGrip(sw, c, 0x8a7a5a, 0.22, 0.016, 5, 0x6a5a40); const pm = c.mk(new THREE.ConeGeometry(0.012, 0.06, 6), GL || 0x50545e, 0.003, c.metal(c.rar, 0x50545e)); pm.position.y = 0.25; sw.add(pm); return L; }
  if (base === 'Espada de Duelo') { // 50.3: rapieira — lâmina longa e finíssima, guarda varrida de anéis e arcos entrelaçados, cabo canelado, pomo redondo
    const L = 1.0; sw.add(c.mk(bladeGeo([[0.011, 0], [0.009, -L * 0.7], [0.005, -L * 0.92], [0, -L]], 0.006), 0xdde3ec, 0.003, c.metal(c.rar, 0xdde3ec)));
    const gd = c.mk(new THREE.BoxGeometry(0.16, 0.012, 0.016), 0x9aa2ae, 0.002, c.metal(c.rar, 0x9aa2ae)); sw.add(gd);
    for (const [rad, x, y, rx] of [[0.04, 0, -0.03, 0], [0.055, 0.03, 0.06, 0.8], [0.055, -0.03, 0.06, -0.8], [0.07, 0.0, 0.1, 1.5]] as [number, number, number, number][]) { const rg = c.mk(new THREE.TorusGeometry(rad, 0.005, 5, 14), 0x9aa2ae, 0.002, c.metal(c.rar, 0x9aa2ae)); rg.position.set(x, y, 0); rg.rotation.set(rx, Math.PI / 2, 0); sw.add(rg); }
    const bow = c.mk(new THREE.TorusGeometry(0.1, 0.005, 5, 16, Math.PI), 0x9aa2ae, 0.002, c.metal(c.rar, 0x9aa2ae)); bow.position.set(0.02, 0.1, 0); bow.rotation.z = -Math.PI / 2 + 0.3; sw.add(bow); // arco de mão até o pomo
    const grip = c.mk(new THREE.CylinderGeometry(0.012, 0.013, 0.16, 8), 0x8a8e96, 0.003, c.metal(c.rar, 0x8a8e96)); grip.position.y = 0.1; sw.add(grip); for (let i = 0; i < 6; i++) { const rr = c.mk(new THREE.TorusGeometry(0.014, 0.002, 4, 10), 0x5a5e66, 0); rr.rotation.x = Math.PI / 2; rr.position.y = 0.03 + i * 0.025; sw.add(rr); }
    const pm = c.mk(new THREE.SphereGeometry(0.02, 8, 6), GL || 0x9aa2ae, 0.003, c.metal(c.rar, 0x9aa2ae)); pm.position.y = 0.2; sw.add(pm); return L; }
  if (base === 'Florete') { // florete de esgrima: lâmina quadrada finíssima e longa, guarda em concha (copo), cabo reto com arame, pomo em pera
    const L = 1.02, st = 0xe4e8ee; sw.add(c.mk(bladeGeo([[0.008, 0], [0.007, -L * 0.75], [0.004, -L * 0.94], [0, -L]], 0.007), st, 0.003, c.metal(c.rar, st)));
    const cup = c.mk(new THREE.SphereGeometry(0.06, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.42), 0xb8bec8, 0.002, c.metal(c.rar, 0xb8bec8)); cup.rotation.x = Math.PI; cup.position.y = 0.0; sw.add(cup); // a concha abre para a lâmina
    const qn = c.mk(new THREE.BoxGeometry(0.11, 0.008, 0.008), 0x9aa2ae, 0.002, c.metal(c.rar, 0x9aa2ae)); qn.position.y = 0.012; sw.add(qn);
    wrapGrip(sw, c, 0x2a2228, 0.14, 0.011, 8, 0xb8bec8);
    const pm = c.mk(new THREE.SphereGeometry(0.018, 8, 6), GL || 0xb8bec8, 0.003, c.metal(c.rar, 0xb8bec8)); pm.scale.set(1, 1.4, 1); pm.position.y = 0.15; sw.add(pm); return L; }
  if (base === 'Garras de Ferro') { // garras do licantropo: manopla de couro na mão com três lâminas curvas saindo dos nós dos dedos
    const dk = 0x5a5e66; const band = c.mk(new THREE.BoxGeometry(0.1, 0.07, 0.05), 0x3a2a1e, 0.003); band.position.y = 0.02; sw.add(band);
    for (let i = -1; i <= 1; i++) { const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(i * 0.032, -0.01, 0), new THREE.Vector3(i * 0.036, -0.14, 0.015), new THREE.Vector3(i * 0.04, -0.26, 0.05), new THREE.Vector3(i * 0.042, -0.33, 0.1)]);
      const cl = c.mk(new THREE.TubeGeometry(cv, 8, 0.009, 4), dk, 0.002, c.metal(c.rar, dk)); sw.add(cl); const tip = c.mk(new THREE.ConeGeometry(0.009, 0.05, 4), 0xc8ccd4, 0, c.metal(c.rar, 0xc8ccd4)); tip.position.set(i * 0.042, -0.35, 0.115); tip.rotation.x = Math.PI - 0.5; sw.add(tip); }
    for (let i = 0; i < 3; i++) { const st = c.mk(new THREE.CylinderGeometry(0.006, 0.006, 0.012, 5), 0x9aa0a8, 0); st.rotation.z = Math.PI / 2; st.position.set(-0.03 + i * 0.03, 0.045, 0.026); sw.add(st); } return 0.33; }
  if (base === 'Besta de Mão') { // besta de uma mão do caçador: coronha curta de nogueira, arco de aço pequeno na ponta, corda, virote carregado e gatilho
    const wd = 0x5a3a22, st = 0x8a8e96; const stock = c.mk(new THREE.BoxGeometry(0.035, 0.36, 0.045), wd, 0.003); stock.position.y = -0.12; sw.add(stock);
    const grip = c.mk(new THREE.BoxGeometry(0.03, 0.11, 0.04), wd, 0.003); grip.position.set(0, 0.05, -0.025); grip.rotation.x = 0.4; sw.add(grip);
    for (const sx of [-1, 1]) { const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.28, 0), new THREE.Vector3(sx * 0.1, -0.27, 0), new THREE.Vector3(sx * 0.17, -0.23, 0)]); sw.add(c.mk(new THREE.TubeGeometry(cv, 6, 0.007, 4), st, 0.002, c.metal(c.rar, st))); }
    const str = c.mk(new THREE.BoxGeometry(0.34, 0.003, 0.003), 0xc8c0a8, 0); str.position.y = -0.2; sw.add(str);
    const bolt = c.mk(new THREE.CylinderGeometry(0.004, 0.004, 0.22, 4), 0x6a4a2a, 0); bolt.position.set(0, -0.26, 0.026); sw.add(bolt); const bh = c.mk(new THREE.ConeGeometry(0.008, 0.03, 4), 0xc8ccd4, 0); bh.position.set(0, -0.38, 0.026); bh.rotation.x = Math.PI; sw.add(bh);
    const trg = c.mk(new THREE.TorusGeometry(0.014, 0.003, 4, 8), st, 0); trg.position.set(0, 0.01, -0.03); trg.rotation.y = Math.PI / 2; sw.add(trg);
    const sil = c.mk(new THREE.OctahedronGeometry(0.014, 0), GL || 0xd8dde4, 0.002, c.metal(c.rar, 0xd8dde4)); sil.position.set(0, -0.05, 0.03); sw.add(sil); return 0.4; }
  if (base === 'Pistola de Latão') { // pistola dos tecnocratas, de uma mão: cano de aço escuro, corpo e tambor de latão, cabo de nogueira inclinado (cano em -Y, cabo para baixo em -Z)
    const br = 0xb08a3c, dk = 0x2e3036, wd = 0x5a3a22;
    const body = c.mk(new THREE.BoxGeometry(0.04, 0.11, 0.06), br, 0.003, c.metal(c.rar, br)); body.position.set(0, -0.04, 0.012); sw.add(body);
    const drum = c.mk(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8), 0xb8743a, 0.003); drum.position.set(0, -0.06, 0.02); sw.add(drum);
    const bar = c.mk(new THREE.CylinderGeometry(0.012, 0.011, 0.22, 8), dk, 0.003); bar.position.set(0, -0.2, 0.026); sw.add(bar);
    const ring = c.mk(new THREE.CylinderGeometry(0.017, 0.017, 0.015, 8), br, 0.002); ring.position.set(0, -0.3, 0.026); sw.add(ring);
    const grip = c.mk(new THREE.BoxGeometry(0.032, 0.05, 0.1), wd, 0.003); grip.position.set(0, 0.035, -0.04); grip.rotation.x = -0.35; sw.add(grip);
    const trg = c.mk(new THREE.TorusGeometry(0.016, 0.003, 4, 8), dk, 0); trg.position.set(0, -0.015, -0.02); trg.rotation.y = Math.PI / 2; sw.add(trg);
    const ham = c.mk(new THREE.BoxGeometry(0.012, 0.02, 0.025), dk, 0); ham.position.set(0, 0.025, 0.04); sw.add(ham);
    if (GL) { const gem = c.mk(new THREE.OctahedronGeometry(0.01, 0), GL, 0); gem.position.set(0.022, -0.04, 0.012); sw.add(gem); } return 0.32; }
  if (base === 'Escopeta de Cano Duplo') { // escopeta de cano duplo serrada, de uma mão: dois canos lado a lado, báscula de latão, coronha curta de pistola
    const br = 0xa8823a, dk = 0x2a2c32, wd = 0x4a2e1a;
    for (const sx of [-1, 1]) { const b = c.mk(new THREE.CylinderGeometry(0.014, 0.014, 0.34, 8), dk, 0.003); b.position.set(sx * 0.015, -0.24, 0.03); sw.add(b); const mz = c.mk(new THREE.CylinderGeometry(0.017, 0.017, 0.02, 8), br, 0); mz.position.set(sx * 0.015, -0.405, 0.03); sw.add(mz); }
    const rib = c.mk(new THREE.BoxGeometry(0.008, 0.32, 0.008), dk, 0); rib.position.set(0, -0.23, 0.047); sw.add(rib);
    const act = c.mk(new THREE.BoxGeometry(0.046, 0.1, 0.06), br, 0.003, c.metal(c.rar, br)); act.position.set(0, -0.03, 0.02); sw.add(act);
    const fore = c.mk(new THREE.BoxGeometry(0.04, 0.12, 0.03), wd, 0.003); fore.position.set(0, -0.15, 0.008); sw.add(fore);
    const grip = c.mk(new THREE.BoxGeometry(0.034, 0.06, 0.13), wd, 0.003); grip.position.set(0, 0.04, -0.045); grip.rotation.x = -0.5; sw.add(grip);
    const trg = c.mk(new THREE.TorusGeometry(0.018, 0.003, 4, 8), dk, 0); trg.position.set(0, -0.005, -0.02); trg.rotation.y = Math.PI / 2; sw.add(trg);
    for (const sx of [-1, 1]) { const hm = c.mk(new THREE.BoxGeometry(0.01, 0.022, 0.03), dk, 0); hm.position.set(sx * 0.012, 0.02, 0.05); hm.rotation.x = 0.4; sw.add(hm); }
    if (GL) { const gem = c.mk(new THREE.OctahedronGeometry(0.011, 0), GL, 0); gem.position.set(0.026, -0.03, 0.02); sw.add(gem); } return 0.42; }
  if (base === 'Kunai') { // kunai: lâmina losangular curta, cabo enrolado em tecido e argola no pomo (de arremesso)
    const L = 0.2, dk = 0x3a3e46; sw.add(c.mk(bladeGeo([[0.004, 0], [0.024, -L * 0.35], [0.012, -L * 0.8], [0, -L]], 0.005), dk, 0.003, c.metal(c.rar, dk)));
    wrapGrip(sw, c, 0x6a1a1a, 0.11, 0.009, 7, 0x2a2a30); const ring = c.mk(new THREE.TorusGeometry(0.022, 0.005, 5, 12), dk, 0.002, c.metal(c.rar, dk)); ring.position.y = 0.125; sw.add(ring); return L; }
  if (base === 'Adaga de Prata') { // adaga de prata dos caçadores: lâmina larga clara com runa, guarda reta curta, cabo de couro e pomo com o olho
    const L = 0.36, sv = 0xe8ecf2; sw.add(c.mk(bladeGeo([[0.026, 0], [0.024, -L * 0.6], [0.014, -L * 0.88], [0, -L]], 0.007), sv, 0.003, c.metal(c.rar, sv, 0.5)));
    const rn = c.mk(new THREE.BoxGeometry(0.006, L * 0.4, 0.009), GL || 0x6ab0ff, 0, c.toon(GL || 0x6ab0ff, { emissive: new THREE.Color(GL || 0x2a5aa0) })); rn.position.y = -L * 0.32; sw.add(rn);
    const gd = c.mk(new THREE.BoxGeometry(0.1, 0.016, 0.024), 0x6e747c, 0.003, c.metal(c.rar, 0x6e747c)); sw.add(gd);
    wrapGrip(sw, c, 0x3a2a1e, 0.11, 0.012, 6); const pm = c.mk(new THREE.SphereGeometry(0.018, 8, 6), 0xd8dde4, 0.003, c.metal(c.rar, 0xd8dde4)); pm.position.y = 0.12; sw.add(pm); return L; }
  if (base === 'Adaga Fina') { // 48.6: adaga vampírica — lâmina escura com sangue, guarda em galhos de espinho, cabo preto, gema vermelha no pomo em espigão
    const L = 0.44, dk = 0x6a6e78; sw.add(c.mk(bladeGeo([[0.02, 0], [0.02, -L * 0.7], [0.014, -L * 0.88], [0, -L]], 0.006), dk, 0.003, c.metal(c.rar, dk)));
    const blood = c.mk(new THREE.BoxGeometry(0.008, L * 0.3, 0.008), 0x7a0e14, 0, c.toon(0x7a0e14, { emissive: new THREE.Color(0x3a0408) })); blood.position.set(0.004, -L * 0.12, 0); sw.add(blood);
    for (const sx of [-1, 1]) { const br = c.mk(new THREE.TorusGeometry(0.035, 0.005, 4, 10, 1.6), 0x2a2a32, 0.002, c.metal(c.rar, 0x3a3440)); br.position.set(sx * 0.02, 0.0, 0); br.rotation.z = sx > 0 ? -0.3 : Math.PI - 1.3; sw.add(br); for (let i = 0; i < 2; i++) { const th = c.mk(new THREE.ConeGeometry(0.004, 0.02, 4), 0x2a2a32, 0); th.position.set(sx * (0.035 + i * 0.02), -0.012 - i * 0.01, 0); th.rotation.z = sx * -0.9; sw.add(th); } }
    wrapGrip(sw, c, 0x1a1a1e, 0.12, 0.011, 6, 0x3a3a44); const pm = c.mk(new THREE.ConeGeometry(0.01, 0.045, 6), 0x50545e, 0.002, c.metal(c.rar, 0x50545e)); pm.position.y = 0.13; sw.add(pm);
    const gem = c.mk(new THREE.OctahedronGeometry(0.014, 0), GL || 0xc01a2a, 0.002, c.toon(0xc01a2a, { emissive: new THREE.Color(0x500810) })); gem.position.y = 0.12; sw.add(gem); return L; }
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
export type RefShieldStyle = 'planks_blue' | 'nordic_red' | 'anvil' | 'elf_leaf' | 'blackcross' | 'spiked' | 'red_tower' | 'kite_cross' | 'sun' | 'wicker' | 'verdigris' | 'gears';
export const REF_SHIELD_STYLE: Record<string, RefShieldStyle> = { 'Escudo Redondo': 'planks_blue', 'Escudo Nórdico': 'nordic_red', 'Escudo Torre': 'anvil', 'Escudo Élfico': 'elf_leaf', 'Escudo Ogival': 'blackcross', 'Escudo de Espinhos': 'spiked',
  /* prancha 52 */ 'Escudo Pavês': 'red_tower', 'Escudo de Pipa': 'kite_cross', 'Escudo Solar': 'sun', 'Escudo de Vime': 'wicker', 'Escudo de Bronze': 'verdigris', 'Escudo de Engrenagens': 'gears' };
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
  } else if (style === 'red_tower') { // 52.1: pavês retangular de madeira pintada de vermelho-vinho, moldura clara, três cintas, umbo de ferro
    g.fillStyle = '#6e1a1c'; g.fillRect(0, 0, S, S); for (let i = 0; i < 200; i++) { g.fillStyle = R() < 0.5 ? '#8a2a2a30' : '#40101040'; g.fillRect(R() * S, R() * S, 3 + R() * 10, 1 + R() * 3); }
    g.strokeStyle = '#e8d8b0'; g.lineWidth = 7; g.strokeRect(S * 0.07, S * 0.05, S * 0.86, S * 0.9); g.strokeStyle = '#5a1416'; g.lineWidth = 3; for (const y of [0.3, 0.7]) { g.beginPath(); g.moveTo(S * 0.07, S * y); g.lineTo(S * 0.93, S * y); g.stroke(); }
    g.fillStyle = '#8a8e96'; g.beginPath(); g.arc(cx, cy, 30, 0, 7); g.fill(); g.fillStyle = '#50545c'; g.beginPath(); g.arc(cx, cy, 22, 0, 7); g.fill(); scratches(8, '#e8d8b040');
  } else if (style === 'kite_cross') { // 52.2: escudo de pipa de madeira escura com cruz de madeira clara e umbo de ferro no cruzamento
    planks(['#4a2a18', '#3e2214', '#54301c'], 6); g.fillStyle = '#d8c8a0'; g.fillRect(cx - 18, 0, 36, S); g.fillRect(0, S * 0.34, S, 36); g.strokeStyle = '#00000040'; g.lineWidth = 2; g.strokeRect(cx - 18, 0, 36, S); g.strokeRect(0, S * 0.34, S, 36);
    g.fillStyle = '#8a8e96'; g.beginPath(); g.arc(cx, S * 0.41, 26, 0, 7); g.fill(); g.fillStyle = '#4a4e56'; g.beginPath(); g.arc(cx, S * 0.41, 16, 0, 7); g.fill(); scratches(12, '#ffffff22');
  } else if (style === 'sun') { // 52.3: redondo de madeira clara com sol de raios gravado, pontos azuis, umbo de madeira
    g.fillStyle = '#c89050'; g.fillRect(0, 0, S, S); for (let i = 0; i < 160; i++) { g.fillStyle = R() < 0.5 ? '#e0a86030' : '#8a5a2a30'; g.fillRect(R() * S, R() * S, 2 + R() * 8, 2); }
    g.fillStyle = '#a06a30'; g.beginPath(); for (let i = 0; i < 32; i++) { const a = i / 32 * 6.283, r = i % 2 ? S * 0.26 : S * 0.42; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.fill();
    g.strokeStyle = '#7a4a1a'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, S * 0.2, 0, 7); g.stroke(); g.fillStyle = '#d8a060'; g.beginPath(); g.arc(cx, cy, S * 0.12, 0, 7); g.fill();
    g.fillStyle = '#4a7ad0'; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + 0.2; g.beginPath(); g.arc(cx + Math.cos(a) * S * 0.36, cy + Math.sin(a) * S * 0.36, 4, 0, 7); g.fill(); }
    g.strokeStyle = '#7a4a1a'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, S * 0.47, 0, 7); g.stroke();
  } else if (style === 'wicker') { // 52.4: vime trançado em anéis com faixas escuras, espiral no centro
    g.fillStyle = '#c89a50'; g.fillRect(0, 0, S, S); for (let r = 8; r < S * 0.72; r += 10) { g.strokeStyle = (Math.floor(r / 30) % 2) ? '#6a4420' : '#d8aa60'; g.lineWidth = 6; g.beginPath(); g.ellipse(cx, cy, r, r * 0.8, 0, 0, 7); g.stroke(); g.strokeStyle = '#00000040'; g.lineWidth = 1; g.beginPath(); for (let a = 0; a < 6.3; a += 0.12) g.lineTo(cx + Math.cos(a) * (r + (a * 25 % 2 ? 2 : -2)), cy + Math.sin(a) * (r + 2) * 0.8); g.stroke(); }
    g.strokeStyle = '#5a3a18'; g.lineWidth = 4; g.beginPath(); for (let a = 0; a < 9; a += 0.1) g.lineTo(cx + Math.cos(a) * a * 2.4, cy + Math.sin(a) * a * 2.4); g.stroke();
  } else if (style === 'verdigris') { // 52.5: bronze com pátina verde-cobre no centro, borda de latão com gregas
    g.fillStyle = '#4a6a4a'; g.fillRect(0, 0, S, S); for (let i = 0; i < 300; i++) { g.fillStyle = R() < 0.5 ? '#6a8a6040' : '#2a4a3a50'; g.beginPath(); g.arc(R() * S, R() * S, 2 + R() * 7, 0, 7); g.fill(); }
    g.strokeStyle = '#b8862e'; g.lineWidth = 14; g.beginPath(); g.arc(cx, cy, S * 0.44, 0, 7); g.stroke(); g.strokeStyle = '#6a4a18'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, S * 0.4, 0, 7); g.stroke();
    g.strokeStyle = '#3a2a10'; g.lineWidth = 2; for (let i = 0; i < 28; i++) { const a = i / 28 * 6.283; g.save(); g.translate(cx + Math.cos(a) * S * 0.44, cy + Math.sin(a) * S * 0.44); g.rotate(a); g.strokeRect(-4, -4, 8, 8); g.restore(); } // gregas
    g.fillStyle = '#b8862e'; g.beginPath(); g.arc(cx, cy, 18, 0, 7); g.fill();
  } else if (style === 'gears') { // 52.6: latão com engrenagens, anéis rebitados e um manômetro no centro (tecnocrata)
    g.fillStyle = '#b08a40'; g.fillRect(0, 0, S, S); for (let i = 0; i < 200; i++) { g.fillStyle = R() < 0.5 ? '#d8b05030' : '#6a4a1040'; g.fillRect(R() * S, R() * S, 2 + R() * 6, 2 + R() * 6); }
    const gear = (x: number, y: number, r: number, n: number, col: string) => { g.fillStyle = col; g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * 6.283, rr = i % 2 ? r : r * 0.78; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); g.fillStyle = '#5a4018'; g.beginPath(); g.arc(x, y, r * 0.25, 0, 7); g.fill(); };
    gear(cx - 46, cy - 40, 30, 9, '#8a6a30'); gear(cx + 48, cy + 34, 34, 10, '#9a7a38'); gear(cx + 40, cy - 52, 20, 7, '#7a5a28'); gear(cx - 50, cy + 48, 22, 8, '#7a5a28');
    g.strokeStyle = '#6a4a18'; g.lineWidth = 8; g.beginPath(); g.arc(cx, cy, S * 0.44, 0, 7); g.stroke(); g.strokeStyle = '#c8a050'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, S * 0.3, 0, 7); g.stroke();
    g.fillStyle = '#5a4a30'; for (let i = 0; i < 20; i++) { const a = i / 20 * 6.283; g.beginPath(); g.arc(cx + Math.cos(a) * S * 0.44, cy + Math.sin(a) * S * 0.44, 3.5, 0, 7); g.fill(); }
    g.fillStyle = '#e8e0c8'; g.beginPath(); g.arc(cx, cy, 26, 0, 7); g.fill(); g.strokeStyle = '#3a3020'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 26, 0, 7); g.stroke(); g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 14, cy - 16); g.stroke(); // manômetro
    g.strokeStyle = '#8a2020'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 20, -0.9, -0.2); g.stroke();
  } else { // 51.6 spiked: redondo escuro com redemoinho gravado e respingos de sangue
    g.fillStyle = '#1e2024'; g.fillRect(0, 0, S, S); g.strokeStyle = '#3a3e46'; g.lineWidth = 4; for (let k = 0; k < 3; k++) { g.beginPath(); for (let a = 0; a < 12; a += 0.15) { const r = 8 + a * 9; g.lineTo(cx + Math.cos(a + k * 2.1) * r, cy + Math.sin(a + k * 2.1) * r * 0.9); } g.stroke(); }
    g.fillStyle = '#7a0e14'; for (let i = 0; i < 14; i++) { const x = cx + (R() - 0.5) * S * 0.8, y = cy + (R() - 0.5) * S * 0.8; g.beginPath(); g.ellipse(x, y, 2 + R() * 6, 3 + R() * 10, R() * 3, 0, 7); g.fill(); }
    g.fillStyle = '#50545e'; g.beginPath(); g.arc(cx, cy, 26, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; cache.set(key, t); return t;
}
