import * as THREE from 'three';

/** Marcação de chão para magias e guarda: círculo (área), cone (direção/guarda) ou linha (investida). */
export type AimKind = 'circle' | 'cone' | 'line';
export interface AimSpec { kind: AimKind; radius: number; range: number; color: number; arc?: number; label?: string }

function discTex(): THREE.Texture {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!;
  const r = 128, gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, 'rgba(255,255,255,.10)'); gr.addColorStop(0.78, 'rgba(255,255,255,.18)'); gr.addColorStop(0.86, 'rgba(255,255,255,.95)'); gr.addColorStop(0.93, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  // runas / marcas de quadrante
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3;
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.beginPath(); g.moveTo(r + Math.cos(a) * 92, r + Math.sin(a) * 92); g.lineTo(r + Math.cos(a) * 104, r + Math.sin(a) * 104); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function coneTex(arc: number): THREE.Texture {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!;
  const cx = 128, cy = 128, R = 122, a0 = Math.PI / 2 - arc / 2, a1 = Math.PI / 2 + arc / 2;
  const gr = g.createRadialGradient(cx, cy, 0, cx, cy, R); gr.addColorStop(0, 'rgba(255,255,255,.05)'); gr.addColorStop(0.8, 'rgba(255,255,255,.22)'); gr.addColorStop(0.9, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, a1); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function lineTex(): THREE.Texture {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d')!;
  const gr = g.createLinearGradient(0, 256, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.15, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(255,255,255,.35)');
  g.fillStyle = gr; g.fillRect(6, 0, 52, 256);
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3; g.strokeRect(7, 2, 50, 252);
  g.fillStyle = 'rgba(255,255,255,.9)'; for (let y = 20; y < 236; y += 42) { g.beginPath(); g.moveTo(32, y + 14); g.lineTo(20, y); g.lineTo(44, y); g.closePath(); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createAim(scene: THREE.Scene) {
  const mat = (map: THREE.Texture) => new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 });
  const g = new THREE.Group(); g.visible = false; g.renderOrder = 4; scene.add(g);
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), mat(discTex())); g.add(disc);
  const cones = new Map<number, THREE.Mesh>();
  const line = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mat(lineTex())); line.geometry.translate(0, 0, 0.5); g.add(line);
  const rangeRing = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); rangeRing.renderOrder = 4; rangeRing.visible = false; scene.add(rangeRing);
  const cursor = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.3, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); cursor.renderOrder = 5; cursor.visible = false; scene.add(cursor);
  let spec: AimSpec | null = null, t = 0, cur: THREE.Mesh = disc, fade = 0;
  const out = { x: 0, z: 0, yaw: 0, ok: true };
  function coneFor(arc: number) { let m = cones.get(arc); if (!m) { m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), mat(coneTex(arc))); g.add(m); cones.set(arc, m); } return m; }
  return {
    get active() { return spec !== null; },
    get spec() { return spec; },
    show(s: AimSpec) {
      spec = s; g.visible = true; fade = 0;
      disc.visible = false; line.visible = false; for (const c of cones.values()) c.visible = false;
      cur = s.kind === 'circle' ? disc : s.kind === 'cone' ? coneFor(s.arc ?? 1.2) : line; cur.visible = true;
      (cur.material as THREE.MeshBasicMaterial).color.setHex(s.color); rangeRing.material.color.setHex(s.color); cursor.material.color.setHex(s.color);
      if (s.kind === 'circle') { disc.scale.set(s.radius, 1, s.radius); } else if (s.kind === 'cone') { cur.scale.set(s.radius, 1, s.radius); } else { line.scale.set(Math.max(0.8, s.radius), 1, s.range); }
    },
    hide() { spec = null; g.visible = false; rangeRing.visible = false; cursor.visible = false; },
    /** hx,hz: herói; mx,mz: mouse no chão; hAt: altura do terreno. Retorna o ponto/direção válidos. */
    update(dt: number, hx: number, hz: number, mx: number, mz: number, hAt: (x: number, z: number) => number) {
      if (!spec) return out;
      t += dt; fade = Math.min(1, fade + dt * 6);
      let dx = mx - hx, dz = mz - hz; const dist = Math.hypot(dx, dz) || 1e-4; dx /= dist; dz /= dist;
      const yaw = Math.atan2(dx, dz); out.yaw = yaw;
      const pul = 0.5 + 0.5 * Math.sin(t * 7);
      if (spec.kind === 'circle') {
        const r = Math.min(dist, spec.range); out.x = hx + dx * r; out.z = hz + dz * r;
        g.position.set(out.x, hAt(out.x, out.z) + 0.1, out.z); g.rotation.y = t * 0.6;
        rangeRing.visible = true; rangeRing.position.set(hx, hAt(hx, hz) + 0.09, hz); rangeRing.scale.setScalar(spec.range);
        cursor.visible = true; cursor.position.set(mx, hAt(mx, mz) + 0.11, mz); cursor.rotation.y = -t * 2;
        (cur.material as THREE.MeshBasicMaterial).opacity = fade * (0.8 + 0.2 * pul);
      } else {
        out.x = hx + dx * spec.range; out.z = hz + dz * spec.range;
        g.position.set(hx, hAt(hx, hz) + 0.1, hz); g.rotation.y = yaw;
        rangeRing.visible = false; cursor.visible = spec.kind === 'line'; cursor.position.set(out.x, hAt(out.x, out.z) + 0.11, out.z);
        (cur.material as THREE.MeshBasicMaterial).opacity = fade * (0.75 + 0.25 * pul);
      }
      return out;
    },
  };
}
