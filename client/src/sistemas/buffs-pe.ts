/* BUFFS E DEBUFFS NO PÉ DO HERÓI + A ENTRADA DE UM EFEITO (10/11, Erling: "deveria ter uma apresentação de buff mais legal, com partículas;
   aparece lá em cima do lado da guarda alta, e no meu pé, para visão rápida, ícones pequenos e minimalistas mostram os buffs e debuffs").
   - No pé: uma fileira de bolinhas de 18 px, uma por efeito de luta em curso (os de dias e horas ficam só na barra do alto).
     Borda dourada = a favor, vermelha = contra; o anel em volta esvazia com o tempo que falta.
   - Ao entrar um efeito novo: um aro 3D sobe dos pés à cabeça e uma espiral de partículas gira em volta do herói, na cor do efeito. */
import * as THREE from 'three';

export interface BuffsPeCtx {
  scene: THREE.Scene; fine(o: THREE.Object3D): THREE.Object3D; camera: THREE.Camera; canvas: HTMLCanvasElement;
  heroPos(): THREE.Vector3; hidden(): boolean;
  buffs(): { id: string; name: string; ic: string; t?: number; good: boolean; tip: string }[];
  particles: { spawn(x: number, y: number, z: number, o: Record<string, number>): void };
}
const SHORT = 600; /* acima de 10 min é efeito de longa duração: não vai para o pé */
const COL: Record<string, number> = { dmg: 0xff8a3a, def: 0x6ab8ff, move: 0x8affc0, hot: 0x7aff8a, serene: 0xffd24a, amb: 0xc9a0ff, ctr: 0xffe08a, form: 0xff5ad0, slow: 0x7a9aff, charm: 0xff6ab8 };

export function createBuffsPe(ctx: BuffsPeCtx) {
  const st = document.createElement('style'); st.textContent = `
    #footfx { position: fixed; left: 0; top: 0; z-index: 7; display: flex; gap: 3px; pointer-events: none; transform: translate(-50%, 0); will-change: transform; }
    #footfx i { --k: 1; --c: #e6c46a; position: relative; width: 18px; height: 18px; border-radius: 50%; display: grid; place-items: center; font: 700 10px/1 Georgia, serif; font-style: normal; color: #fff3d0; background: conic-gradient(var(--c) calc(var(--k) * 360deg), rgba(0,0,0,.55) 0); box-shadow: 0 1px 3px rgba(0,0,0,.8); }
    #footfx i::before { content: ''; position: absolute; inset: 2px; border-radius: 50%; background: rgba(14,10,8,.92); }
    #footfx i b { position: relative; font-weight: 700; filter: grayscale(.35); }
    #footfx i.bad { --c: #ff4a3a; color: #ffd0c8; } #footfx i.new { animation: ffxIn .45s cubic-bezier(.2,1.6,.4,1); }
    @keyframes ffxIn { 0% { transform: scale(0) translateY(-14px); } 100% { transform: none; } }`;
  document.head.appendChild(st);
  const el = document.createElement('div'); el.id = 'footfx'; document.body.appendChild(el);
  const maxT = new Map<string, number>(), nodes = new Map<string, HTMLElement>(); let first = true, acc = 0; const v = new THREE.Vector3();
  /* o aro que sobe */
  const rings: { m: THREE.Mesh; t: number }[] = [];
  function enter(col: number, good: boolean) { const p = ctx.heroPos();
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.045, 8, 36).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); m.position.copy(p); m.userData.dyn = true; ctx.scene.add(ctx.fine(m)); rings.push({ m, t: 0 });
    for (let i = 0; i < 30; i++) { const a = (i / 30) * 6.283 * 2, r = 0.55, up = good ? 1 : -1; ctx.particles.spawn(p.x + Math.cos(a) * r, p.y + (good ? 0.1 : 1.9) + (i / 30) * 0.5 * up, p.z + Math.sin(a) * r, { vx: -Math.sin(a) * 2.2, vy: (1.4 + (i / 30) * 1.6) * up, vz: Math.cos(a) * 2.2, life: 0.9, s0: 0.14, s1: 0.02, c0: 0xffffff, c1: col, a: 0.95, drag: 1.2 }); } }
  function update(dt: number) {
    for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt; const k = r.t / 0.7, p = ctx.heroPos(); r.m.position.set(p.x, p.y + 0.05 + 1.9 * k, p.z); r.m.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.25); (r.m.material as THREE.MeshBasicMaterial).opacity = 0.95 * (1 - k * k);
      if (k >= 1) { ctx.scene.remove(r.m); r.m.geometry.dispose(); (r.m.material as THREE.Material).dispose(); rings.splice(i, 1); } }
    /* a posição acompanha o herói todo quadro; a lista é refeita 5× por segundo */
    if (ctx.hidden()) { if (!el.hidden) el.hidden = true; return; }
    const p = ctx.heroPos(); v.set(p.x, p.y - 0.15, p.z).project(ctx.camera); const rc = ctx.canvas.getBoundingClientRect();
    el.style.transform = `translate(${(rc.left + (v.x * 0.5 + 0.5) * rc.width).toFixed(1)}px, ${(rc.top + (-v.y * 0.5 + 0.5) * rc.height + 8).toFixed(1)}px) translate(-50%, 0)`;
    acc += dt; if (acc < 0.2) return; acc = 0;
    const L = ctx.buffs().filter((b) => b.t === undefined ? ['serene', 'amb', 'ctr', 'form', 'slow', 'charm'].includes(b.id) : b.t <= SHORT), seen = new Set<string>();
    for (const b of L) { seen.add(b.id); let n = nodes.get(b.id);
      if (!n) { n = document.createElement('i'); n.innerHTML = `<b>${b.ic}</b>`; n.className = (b.good ? '' : 'bad ') + (first ? '' : 'new'); n.style.setProperty('--c', b.good ? '#' + (COL[b.id] ?? 0xe6c46a).toString(16).padStart(6, '0') : '#ff4a3a'); nodes.set(b.id, n); el.appendChild(n); maxT.set(b.id, b.t ?? 1);
        if (!first) enter(b.good ? COL[b.id] ?? 0xe6c46a : 0xff4a3a, b.good); }
      if (b.t !== undefined) { const mx = Math.max(maxT.get(b.id) ?? b.t, b.t); maxT.set(b.id, mx); n.style.setProperty('--k', Math.max(0.02, Math.min(1, b.t / mx)).toFixed(3)); } }
    for (const [id, n] of nodes) if (!seen.has(id)) { n.remove(); nodes.delete(id); maxT.delete(id); }
    el.hidden = !L.length; first = false;
  }
  return { update };
}
