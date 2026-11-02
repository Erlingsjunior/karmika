/* TRABALHO NA BANCADA: o ícone do ofício com a barra girando, o trabalho em andamento e o assado na fogueira. Saiu do main.ts (02/11). */
import { heightAt } from '../world';
import * as THREE from 'three';
import { fine } from '../dual3d';
import type { BancadaCtx } from '../main';

export function createBancada(K: BancadaCtx) {
/* ---------- trabalho na bancada (Erling, 23/10): o ícone do ofício no meio, uma barra girando em volta, som de trabalho,
   o herói trabalhando; cada peça pronta dá um brilho e soma no contador. Rápido: é para animar, não para esperar. ---------- */
const JOB: Record<string, { ic: string; verb: string; act: Parameters<typeof K.hero.act>[0]; snd: Parameters<typeof K.audio.work>[0]; beat: number; col: string }> = {
  ferreiro: { ic: '🔨', verb: 'Forjando', act: 'mine', snd: 'hammer', beat: 0.42, col: '#ff9a4a' },
  marceneiro: { ic: '🪚', verb: 'Serrando', act: 'chop', snd: 'saw', beat: 0.5, col: '#e8c890' },
  alquimista: { ic: '⚗️', verb: 'Preparando', act: 'herb', snd: 'brew', beat: 0.45, col: '#7aff9a' },
  cozinheiro: { ic: '🍳', verb: 'Cozinhando', act: 'herb', snd: 'cook', beat: 0.6, col: '#ffd27a' },
  costureiro: { ic: '🧵', verb: 'Costurando', act: 'herb', snd: 'sew', beat: 0.3, col: '#d8b8ff' },
  fogueira: { ic: '🔥', verb: 'Assando', act: 'herb', snd: 'cook', beat: 0.9, col: '#ff9a4a' },
};
const jobEl = document.createElement('div'); jobEl.id = 'craftjob'; document.body.appendChild(jobEl);
let job: { stop(why?: string): void } | null = null;
function craftJob(j: { prof: string; name: string; icon: string; times: number; step(k: number): boolean; can(): boolean }, onEnd?: () => void) {
  job?.stop(); const J = JOB[j.prof] ?? { ic: '⚒', verb: 'Fazendo', act: 'herb' as const, snd: 'carve' as const, beat: 0.5, col: '#ffe08a' };
  const PER = j.times === 1 ? 1.9 : 1.15, x0 = K.state.fx, y0 = K.state.fy; /* uma peça só: preparo mais longo e visível (Erling 26/10: 'um item só tem que ter a animação de preparo') */ let k = 0, t = 0, beatT = 0, last = performance.now(), raf = 0, alive = true;
  jobEl.innerHTML = `<div class="cj-ring"><svg viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="27"/><circle class="fg" cx="32" cy="32" r="27" style="stroke:${J.col}"/></svg><span class="cj-ic">${J.ic}</span><span class="cj-flash"></span></div>
    <div class="cj-txt"><b>${J.verb}: ${j.icon} ${j.name}</b><small><span class="cj-n">0</span> / ${j.times} · mova-se para parar</small></div><div class="cj-pop"></div>`;
  jobEl.classList.add('on'); const fg = jobEl.querySelector('.fg') as SVGCircleElement, C = 2 * Math.PI * 27; fg.style.strokeDasharray = `${C}`; fg.style.strokeDashoffset = `${C}`;
  const stop = (why?: string) => { if (!alive) return; alive = false; cancelAnimationFrame(raf); job = null; onEnd?.(); setTimeout(() => { if (!job) jobEl.classList.remove('on'); }, why ? 900 : 1300); if (why) K.game.logMsg(why, '#b9c6e0'); };
  job = { stop };
  const tick = () => { if (!alive) return; const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt; beatT -= dt;
    if (Math.hypot(K.state.fx - x0, K.state.fy - y0) > 0.5 || K.game.st.dead) { stop('Você parou o trabalho.'); return; }
    if (beatT <= 0) { beatT = J.beat; K.hero.act(J.act, true); K.audio.work(J.snd); }
    fg.style.strokeDashoffset = String(C * (1 - Math.min(1, t / PER)));
    if (t >= PER) { t = 0; const ok = j.step(k); if (!ok) { stop(k ? `⚒ Pronto: ${k}× ${j.name}.` : undefined); return; } k++;
      K.audio.craftDone(); (jobEl.querySelector('.cj-n') as HTMLElement).textContent = String(k);
      const fl = jobEl.querySelector('.cj-flash') as HTMLElement; fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
      const pop = jobEl.querySelector('.cj-pop') as HTMLElement; pop.textContent = `+1 ${j.icon}`; pop.classList.remove('go'); void pop.offsetWidth; pop.classList.add('go');
      if (k >= j.times || !j.can()) { stop(k > 1 ? `⚒ Pronto: ${k}× ${j.name}.` : undefined); return; } }
    raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick);
}
/** assar na fogueira (25/10): o herói se agacha, um espeto gira sobre o fogo com a carne (ou o peixe) dourando, chia e solta fumaça;
    cada peça pronta pula para a mochila. Assa tudo o que tiver; andar para. */
function roastAt(fx: number, fz: number) {
  const fy = heightAt(fx, fz), spit = new THREE.Group(); spit.position.set(fx, fy + 0.62, fz);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.3, 5).rotateZ(Math.PI / 2), new THREE.MeshToonMaterial({ color: 0x6a4a2a })); spit.add(stick);
  for (const sx of [-0.55, 0.55]) { const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.7, 4), stick.material); fork.position.set(sx, -0.3, 0); spit.add(fork); }
  const meatMat = new THREE.MeshToonMaterial({ color: 0xc8605a }), meat = new THREE.Group(); spit.add(meat);
  for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.11 + (i % 2) * 0.02, 7, 5), meatMat); m.scale.set(1.25, 0.9, 0.9); m.position.x = (i - 1) * 0.2; meat.add(m); }
  K.scene.add(fine(spit));
  let cur = K.inv.has('meat') ? 'meat' : 'fish'; const tint = (k: number) => meatMat.color.setHex(0xc8605a).lerp(new THREE.Color(cur === 'meat' ? 0x6a3410 : 0xb07a3a), k);
  const t0 = performance.now(); let alive = true;
  const spin = () => { if (!alive) return; const k = ((performance.now() - t0) / 1000) % 1.15 / 1.15; meat.rotation.x += 0.09; tint(k);
    if (Math.random() < 0.35) K.particles.spawn(fx + (Math.random() - 0.5) * 0.4, fy + 0.6, fz + (Math.random() - 0.5) * 0.2, { vy: 0.7 + Math.random() * 0.5, life: 1.6, s0: 0.12, s1: 0.5, c0: 0xc8c0b0, c1: 0x5a5450, a: 0.3, drag: 0.4, w: 0.5 });
    if (Math.random() < 0.2) K.particles.spawn(fx + (Math.random() - 0.5) * 0.3, fy + 0.55, fz, { vx: (Math.random() - 0.5) * 1.4, vy: 1 + Math.random(), vz: (Math.random() - 0.5) * 1.4, life: 0.35, s0: 0.07, s1: 0.02, c0: 0xfff0a0, c1: 0xff6a10, a: 1, g: 6 }); /* gordura que pinga e estala */
    requestAnimationFrame(spin); };
  requestAnimationFrame(spin);
  const done = () => { alive = false; K.scene.remove(spit); };
  craftJob({ prof: 'fogueira', name: cur === 'meat' ? 'Carne assada' : 'Peixe assado', icon: cur === 'meat' ? '🍖' : '🐟', times: K.inv.count('meat') + K.inv.count('fish'),
    step: () => { const raw = K.inv.has(cur) ? cur : K.inv.has('meat') ? 'meat' : K.inv.has('fish') ? 'fish' : null; if (!raw) return false; K.inv.take(raw); K.inv.add(raw === 'meat' ? 'cooked' : 'fishc', 1, true); cur = K.inv.has('meat') ? 'meat' : 'fish'; return true; },
    can: () => K.inv.has('meat') || K.inv.has('fish') }, done);
}
document.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('[data-profgo]')) { K.inv.closeAll(); K.profs.toggle(); } });
  return { craftJob, roastAt };
}
