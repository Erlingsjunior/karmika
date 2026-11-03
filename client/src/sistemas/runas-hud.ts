/* RUNAS NÍTIDAS NAS PEDRAS DE TELEPORTE (03/11, Erling: "melhore a qualidade especificamente do pixel das runas: independente do pixel da tela,
   as runas precisam ser legíveis"). O mundo é desenhado em baixa resolução (o pixel do jogo); as runas da pedra, não. Elas vão numa camada HTML
   por cima do canvas, em SVG na resolução real da tela, presas à face da pedra (projeção da câmera isométrica fixa). Por baixo, a pedra
   continua com o sulco escavado das mesmas runas, no pixel do jogo. Douradas chamando antes de marcar, azul mágico depois. */
import * as THREE from 'three';
import { RUNAS } from '../runas';

type Relic = { runes: THREE.Mesh; ring: THREE.Mesh; seed: number };
const layer = document.createElement('div'); layer.id = 'runehud';
layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2;overflow:hidden';
document.body.appendChild(layer);
const pool = new Map<Relic, HTMLDivElement>();
const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), nrm = new THREE.Vector3(), q = new THREE.Quaternion();
/** as seis runas oficiais em 2 colunas × 3 linhas (a mesma grade do sulco na pedra), traço vazado dourado/azul com brilho */
function mk(): HTMLDivElement {
  const d = document.createElement('div'); d.style.cssText = 'position:absolute;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,1fr);place-items:center;transform:translate(-50%,-50%) skewY(var(--sk,0deg));will-change:transform,left,top';
  d.innerHTML = RUNAS.map((r) => `<svg viewBox="0 0 28 28" style="width:78%;height:78%;overflow:visible"><path d="${r.d}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>${r.fill ? `<path d="${r.fill}" fill="currentColor"/>` : ''}</svg>`).join('');
  layer.appendChild(d); return d;
}
/** chamar a cada quadro: relics da cena, a câmera, quem já foi marcado e se a camada deve sumir (menu, interior, mapa) */
export function runeHud(relics: Relic[], cam: THREE.Camera, known: (r: Relic) => boolean, t: number, hide: boolean) {
  layer.style.display = hide ? 'none' : ''; if (hide) return;
  const W = innerWidth, H = innerHeight, seen = new Set<Relic>();
  cam.getWorldDirection(v2);
  for (const rl of relics) {
    if (!rl.ring.userData.stone || !rl.runes.parent) continue; /* só as pedras rúnicas (o portal das vilas tem véu próprio) */
    const m = rl.runes; m.updateWorldMatrix(true, false); m.getWorldPosition(v0);
    m.getWorldQuaternion(q); nrm.set(0, 0, 1).applyQuaternion(q); if (Math.abs(nrm.dot(v2)) < 0.25) continue; /* a face virou de lado para a câmera */
    v1.copy(v0).project(cam); if (v1.z < -1 || v1.z > 1 || Math.abs(v1.x) > 1.2 || Math.abs(v1.y) > 1.2) continue;
    const cx = (v1.x * 0.5 + 0.5) * W, cy = (0.5 - v1.y * 0.5) * H;
    /* tamanho na tela: projeta a borda de cima e a lateral da placa (0,8 × 1,2 m) */
    v1.set(0, 0.6, 0).applyMatrix4(m.matrixWorld).project(cam); const ty = (0.5 - v1.y * 0.5) * H;
    v1.set(0.4, 0, 0).applyMatrix4(m.matrixWorld).project(cam); const rx = (v1.x * 0.5 + 0.5) * W, ry = (0.5 - v1.y * 0.5) * H;
    const h = Math.abs(cy - ty) * 2, w = Math.hypot(rx - cx, ry - cy) * 2; if (h < 6) continue;
    const sk = Math.atan2(ry - cy, rx - cx) * 180 / Math.PI;
    let d = pool.get(rl); if (!d) { d = mk(); pool.set(rl, d); } seen.add(rl);
    const k = known(rl), pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + rl.seed), col = k ? '#7ad0ff' : '#ffd36a', glow = k ? '#2a8aff' : '#ff9a1a';
    d.style.display = 'grid'; d.style.left = `${cx}px`; d.style.top = `${cy}px`; d.style.width = `${w}px`; d.style.height = `${h * 0.92}px`; d.style.setProperty('--sk', `${sk.toFixed(1)}deg`);
    d.style.color = col; d.style.opacity = String(k ? 0.85 + 0.15 * pulse : 0.6 + 0.4 * pulse);
    d.style.filter = `drop-shadow(0 0 ${Math.max(1.5, h * 0.03)}px ${glow}) drop-shadow(0 0 ${Math.max(3, h * 0.07)}px ${glow})`;
    m.visible = false; /* o brilho em baixa resolução sai: quem brilha agora é a camada nítida */
  }
  for (const [rl, d] of pool) if (!seen.has(rl)) { if (!rl.runes.parent) { d.remove(); pool.delete(rl); } else { d.style.display = 'none'; rl.runes.visible = true; } }
}
