/* MARCO DOS TERRENOS DE GUILDA (fila de 13/11, Erling: "em cada um dos doze terrenos, um monumento com placa: 'este terreno pertencerá à guilda
   que comprá-lo; proibido construir aqui', e bloqueio de construção dentro do limite").
   Cada terreno reservado ganha no centro um marco de pedra com o cristal da cor do seu lado (ouro para karma positivo, roxo para negativo) e uma
   placa virada para a câmera. O bloqueio de construção fica em sistemas/construcao.ts; a casa do centro vira parede em world.ts. */
import * as THREE from 'three';
import { TILE_M as T } from '@karmika/shared';
import { heightAt, type World } from '../world';

function placa(l1: string, l2: string, l3: string, cor: string): THREE.CanvasTexture { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d')!;
  g.fillStyle = '#1a140e'; g.fillRect(0, 0, 512, 256); g.strokeStyle = cor; g.lineWidth = 6; g.strokeRect(8, 8, 496, 240); g.lineWidth = 2; g.strokeRect(18, 18, 476, 220);
  g.textAlign = 'center'; g.fillStyle = cor; g.font = '700 40px Georgia, serif'; g.fillText(l1, 256, 72); g.fillStyle = '#f0e2c0'; g.font = '26px Georgia, serif'; g.fillText(l2, 256, 124); g.fillText(l3, 256, 158); g.fillStyle = '#ff9a7a'; g.font = '700 28px Georgia, serif'; g.fillText('Proibido construir aqui', 256, 214);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

export function createTerrenosGuilda(scene: THREE.Scene, city: World, log: (m: string, c?: string) => void) {
  const pedra = new THREE.MeshToonMaterial({ color: 0x8a8478 }), escura = new THREE.MeshToonMaterial({ color: 0x4a463e });
  const M: { x: number; z: number; cr: THREE.Mesh; nome: string; karma: number; avisou: number }[] = [];
  for (const [i, g] of (city.guildLots ?? []).entries()) { const x = (g.x0 + 5.5) * T, z = (g.y0 + 5.5) * T, y = heightAt(x, z), luz = g.karma > 0, cor = luz ? 0xffd24a : 0xa04aff;
    const G = new THREE.Group(); G.position.set(x, y, z); G.rotation.y = Math.PI / 4; /* a frente olha para a câmera (sudeste) */
    const add = (geo: THREE.BufferGeometry, mat: THREE.Material, px: number, py: number, pz: number) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.castShadow = true; G.add(m); return m; };
    add(new THREE.CylinderGeometry(1.5, 1.7, 0.5, 8), escura, 0, 0.25, 0); add(new THREE.CylinderGeometry(1.15, 1.4, 0.4, 8), pedra, 0, 0.7, 0);
    add(new THREE.CylinderGeometry(0.42, 0.7, 4.2, 4), pedra, 0, 3.0, 0).rotation.y = Math.PI / 4; /* o obelisco */
    add(new THREE.ConeGeometry(0.46, 0.7, 4), escura, 0, 5.45, 0).rotation.y = Math.PI / 4;
    const cr = add(new THREE.OctahedronGeometry(0.42, 0), new THREE.MeshBasicMaterial({ color: cor }), 0, 6.5, 0); cr.castShadow = false;
    /* a placa, apoiada na base e inclinada para quem chega */
    const pm = new THREE.MeshBasicMaterial({ map: placa('TERRENO DE GUILDA', 'Este terreno pertencerá', 'à guilda que comprá-lo.', luz ? '#ffd24a' : '#c08aff') });
    const pl = add(new THREE.PlaneGeometry(2.4, 1.2), pm, 0, 1.55, 0.78); pl.rotation.x = -0.28; pl.castShadow = false; add(new THREE.BoxGeometry(2.6, 1.36, 0.12), escura, 0, 1.53, 0.7).rotation.x = -0.28;
    /* faixa de runas da cor do lado em volta do obelisco */
    for (const yy of [1.6, 2.6, 3.6]) { const r = add(new THREE.TorusGeometry(0.5 - (yy - 1.6) * 0.06, 0.035, 5, 16), new THREE.MeshBasicMaterial({ color: cor }), 0, yy + 0.4, 0); r.rotation.x = Math.PI / 2; r.castShadow = false; }
    scene.add(G); M.push({ x, z, cr, nome: g.name, karma: g.karma, avisou: -1e9 }); void i; }
  let t = 0;
  return { update(dt: number, hx: number, hz: number) { t += dt; for (const m of M) { const d = Math.hypot(m.x - hx, m.z - hz); if (d > 60) continue; m.cr.rotation.y = t * 0.8; m.cr.position.y = 6.5 + Math.sin(t * 1.4) * 0.12;
        if (d < 5 && t - m.avisou > 45) { m.avisou = t; log(`⚑ ${m.nome}: terreno de guilda (karma ${m.karma > 0 ? 'positivo' : 'negativo'}). Este terreno pertencerá à guilda que comprá-lo. Proibido construir aqui.`, m.karma > 0 ? '#ffe08a' : '#d0a8ff'); } } },
    count: M.length };
}
