import * as THREE from 'three';
import { createCharacter, type Hero3D, type Kind } from './characters';

export interface NpcDef { name: string; role: string; kind: Kind; /** aldeão comum ou elfo (modelo sem armadura) */ civil?: 'human' | 'elf'; x: number; z: number; radius: number; tint: number; scale: number; lines: string[]; /** rota (metros): o NPC anda de um extremo ao outro e volta */ route?: { x: number; z: number }[]; /** só à noite (some de dia) */ night?: boolean }
interface Npc { def: NpcDef; hero: Hero3D; pos: THREE.Vector3; yaw: number; target: THREE.Vector2 | null; wait: number; el: HTMLElement; line: number; lineT: number; spd: number; ri: number; rdir: number }

export function createNpcs(scene: THREE.Scene, defs: NpcDef[], ctx: { heightAt(x: number, z: number): number; walkable(x: number, z: number): boolean; camera: THREE.Camera; canvas: HTMLCanvasElement }) {
  const npcs: Npc[] = defs.map((def) => {
    const hero = createCharacter(def.civil ? 'nordic' : def.kind, { static: true, civil: def.civil, cloth: def.civil ? def.tint : undefined });
    hero.root.scale.setScalar(def.scale); hero.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.castShadow = false; }); // NPCs sem sombra (desempenho)
    const tint = new THREE.Color(def.tint);
    hero.root.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; const mats = Array.isArray(m.material) ? m.material : [m.material]; m.material = (mats.map((mt) => { const t = mt as THREE.MeshToonMaterial; if (!t.color || t.side === THREE.BackSide || (t as unknown as THREE.MeshBasicMaterial).isMeshBasicMaterial) return mt; const c = t.clone(); c.color.lerp(tint, 0.38); return c; }) as THREE.Material[]); const arr = m.material as unknown as THREE.Material[]; if (arr.length === 1) m.material = arr[0]; });
    scene.add(hero.root);
    const el = document.createElement('div'); el.className = 'npc'; el.innerHTML = `<i class="qm"></i><b>${def.name}</b><small>${def.role}</small><p></p>`; document.body.appendChild(el);
    const pos = new THREE.Vector3(def.x, 0, def.z);
    const ri = def.route ? Math.floor(Math.random() * def.route.length) : 0; if (def.route) pos.set(def.route[ri].x, 0, def.route[ri].z);
    return { def, hero, pos, yaw: Math.random() * 6.28, target: null, wait: Math.random() * 3, el, line: 0, lineT: 0, spd: 0, ri, rdir: 1 };
  });
  const v = new THREE.Vector3();
  function update(dt: number, t: number, heroPos: THREE.Vector3, night: number, gust: number) {
    const r = ctx.canvas.getBoundingClientRect();
    for (const n of npcs) {
      const d = n.def, dH = Math.hypot(heroPos.x - n.pos.x, heroPos.z - n.pos.z);
      if (d.night && night < 0.45) { if (n.hero.root.visible) { n.hero.root.visible = false; n.el.style.display = 'none'; } continue; } // a Corte só recebe à noite
      if (dH > 60) { if (n.hero.root.visible) { n.hero.root.visible = false; n.el.style.display = 'none'; } continue; } // longe: nem anima nem desenha
      if (!n.hero.root.visible) { n.hero.root.visible = true; n.pos.y = ctx.heightAt(n.pos.x, n.pos.z); n.hero.root.position.copy(n.pos); }
      let mps = 0, head: number | null = null;
      if (d.route && dH >= 4.5) { // caravana: segue a estrada de um extremo ao outro
        const r0 = d.route; const tg = r0[n.ri]; const dx = tg.x - n.pos.x, dz = tg.z - n.pos.z, l = Math.hypot(dx, dz);
        if (l < 0.6) { n.ri += n.rdir; if (n.ri >= r0.length || n.ri < 0) { n.rdir *= -1; n.ri += n.rdir * 2; n.wait = 6; } }
        else if (n.wait > 0) n.wait -= dt; else { const sp = 1.5 * dt; n.pos.x += dx / l * sp; n.pos.z += dz / l * sp; mps = 1.5; n.yaw = Math.atan2(dx, dz); head = n.yaw; }
      } else if (dH < 4.5) { // olha para o herói
        n.target = null; const w = Math.atan2(heroPos.x - n.pos.x, heroPos.z - n.pos.z); let df = w - n.yaw; while (df > Math.PI) df -= 6.283; while (df < -Math.PI) df += 6.283; n.yaw += df * Math.min(1, dt * 5); head = n.yaw;
      } else if (n.target) {
        const dx = n.target.x - n.pos.x, dz = n.target.y - n.pos.z, l = Math.hypot(dx, dz);
        if (l < 0.3) { n.target = null; n.wait = 2 + Math.random() * 5; } else {
          const sp = 1.2 * dt, nx = n.pos.x + dx / l * sp, nz = n.pos.z + dz / l * sp;
          if (ctx.walkable(nx, nz)) { n.pos.x = nx; n.pos.z = nz; mps = 1.2; n.yaw = Math.atan2(dx, dz); head = n.yaw; } else n.target = null;
        }
      } else {
        n.wait -= dt;
        if (n.wait <= 0) { const a = Math.random() * 6.283, rr = Math.random() * d.radius; const tx = d.x + Math.cos(a) * rr, tz = d.z + Math.sin(a) * rr; if (ctx.walkable(tx, tz)) n.target = new THREE.Vector2(tx, tz); else n.wait = 1; }
      }
      n.pos.y = ctx.heightAt(n.pos.x, n.pos.z);
      n.hero.root.position.copy(n.pos);
      n.hero.setNight(night); n.hero.setWind(gust);
      n.hero.update(dt, t, mps, head);
      n.hero.root.rotation.y = n.yaw;
      // nome e fala
      v.set(n.pos.x, n.pos.y + 2.3 * d.scale, n.pos.z).project(ctx.camera);
      const show = dH < 22 && v.z < 1;
      n.el.style.display = show ? 'block' : 'none';
      if (show) {
        n.el.style.left = r.left + (v.x * 0.5 + 0.5) * r.width + 'px'; n.el.style.top = r.top + (-v.y * 0.5 + 0.5) * r.height + 'px';
        const p = n.el.querySelector('p') as HTMLElement;
        if (dH < 6) { n.lineT += dt; if (n.lineT > 4.5) { n.lineT = 0; n.line = (n.line + 1) % d.lines.length; } p.textContent = d.lines[n.line]; p.style.display = 'block'; } else { p.style.display = 'none'; n.lineT = 4; }
      }
    }
  }
  const talk = (n: Npc) => { n.line = (n.line + 1) % n.def.lines.length; n.lineT = 0; return n.def.lines[n.line]; };
  return { npcs, update, talk };
}
