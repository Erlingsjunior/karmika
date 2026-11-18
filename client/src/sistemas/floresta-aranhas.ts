/* OS PRESOS DA FLORESTA DAS ARANHAS (12/11, Erling: "pessoas enroladas em teia e teias grandes com pessoas presas pedindo socorro").
   O mundo (world.ts) marca onde há um preso vivo (casulo variante 9). Aqui cada um ganha corpo: uma teia de pé, o casulo com o rosto de fora se debatendo
   e o pedido de socorro em letra nítida quando o herói chega perto. Com E o herói corta a teia:
     · quase sempre é gente: ela agradece, foge pela trilha, e o gesto pesa a favor no karma (escolha com consequência, Regra de Ouro 1);
     · às vezes o casulo era isca: saem filhotes.
   Quem foi solto volta a aparecer depois de um bom tempo (outra vítima). Só o desenho e a regra moram aqui. */
import * as THREE from 'three';
import { cocoon } from '../aranhas3d';

export interface PresosCtx { scene: THREE.Scene; fine(o: THREE.Object3D): THREE.Object3D; heightAt(x: number, z: number): number; heroPos(): THREE.Vector3; dentro(): boolean;
  /** lugares (em metros) */ spots: { x: number; z: number }[]; log(t: string, c?: string): void; karma(n: number): void; /** fração da barra de experiência */ xp(frac: number): void; gold(n: number): void;
  isca(x: number, z: number, n: number): void; puff(x: number, y: number, z: number, c0: number, c1: number): void; project(p: THREE.Vector3): { x: number; y: number } | null; som(k: 'corta' | 'susto'): void }
const PEDE = ['Socorro! Aqui, na teia!', 'Por favor, me tira daqui!', 'Ela volta ao anoitecer… corta isso!', 'Não sinto mais as pernas. Socorro!', 'Shhh… elas escutam. Me solta, rápido!', 'Tem alguém aí? Pelo Tear, me ajuda!'];
const GRATO = ['"Que o Tear te pague. Eu vinha só buscar lenha…"', '"Três dias aqui. Três. Obrigado, de verdade."', '"Corre você também: a Mãe não gosta que mexam na despensa."', '"Meu irmão ficou mais para dentro. Se achar um casulo que ainda se mexe…"', '"Eu ouvi ela cantar lá embaixo. Não desça sozinho."'];
const RESPAWN = 15 * 60 * 1000;

export function createPresos(K: PresosCtx) {
  const webM = new THREE.MeshBasicMaterial({ color: 0xc8d0d6, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
  const list = K.spots.map((s, i) => { const g = new THREE.Group(), c = cocoon(true, 0.95); c.position.y = 0.25; g.add(c);
    /* a teia atrás dele: um losango de fios, de frente para a câmera */
    const w = new THREE.Group(); w.rotation.y = Math.PI / 4; for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI, f = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.035), webM); f.rotation.z = a; f.position.set(0, 1.35, -0.25); w.add(f); }
    for (const rr of [0.55, 1.0, 1.45]) { const f = new THREE.Mesh(new THREE.RingGeometry(rr, rr + 0.03, 10), webM); f.position.set(0, 1.35, -0.25); w.add(f); } g.add(w);
    g.position.set(s.x, K.heightAt(s.x, s.z), s.z); g.visible = false; K.fine(g); g.userData.noCull = true; K.scene.add(g);
    return { ...s, g, c, ph: i * 1.7, back: 0, said: 0, line: PEDE[i % PEDE.length] }; });
  const el = document.createElement('div'); el.className = 'dgname'; el.style.display = 'none'; document.body.appendChild(el);
  let last = performance.now();
  const step = () => { const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now; const hp = K.heroPos(), fora = !K.dentro(); let best: (typeof list)[number] | null = null, bd = 14;
    for (const p of list) { const d = Math.hypot(p.x - hp.x, p.z - hp.z), on = fora && d < 70 && now >= p.back; if (p.g.visible !== on) p.g.visible = on; if (!on) continue;
      p.ph += dt * (d < 14 ? 7 : 2.5); p.c.rotation.z = Math.sin(p.ph) * (d < 14 ? 0.1 : 0.04); p.c.rotation.x = Math.sin(p.ph * 0.63) * 0.05;
      if (d < bd) { bd = d; best = p; } }
    if (best) { const sp = K.project(new THREE.Vector3(best.x, best.g.position.y + 2.5, best.z)); if (sp) { if (el.textContent !== best.line) el.innerHTML = `<b>${best.line}</b><small>E — cortar a teia</small>`; el.style.display = 'block'; el.style.left = sp.x + 'px'; el.style.top = sp.y + 'px'; el.style.opacity = String(Math.min(1, (14 - bd) / 4)); } else el.style.display = 'none';
      if (now - best.said > 9000) { best.said = now; best.line = PEDE[Math.floor(Math.random() * PEDE.length)]; } }
    else if (el.style.display !== 'none') el.style.display = 'none';
    requestAnimationFrame(step); };
  requestAnimationFrame(step);
  /** os presos ao alcance da mão (para o E do jogo) */
  const perto = (x: number, z: number, r = 3) => { const now = performance.now(); return list.filter((p) => now >= p.back && Math.hypot(p.x - x, p.z - z) < r).map((p) => ({ p, d: Math.hypot(p.x - x, p.z - z) })); };
  function soltar(p: (typeof list)[number]) { if (performance.now() < p.back) return; p.back = performance.now() + RESPAWN; p.g.visible = false; const y = p.g.position.y;
    for (let i = 0; i < 26; i++) K.puff(p.x + (Math.random() - 0.5) * 1.2, y + 0.3 + Math.random() * 1.6, p.z + (Math.random() - 0.5) * 1.2, 0xffffff, 0xb8c0c8);
    if (Math.random() < 0.22) { K.som('susto'); K.isca(p.x, p.z, 3); K.log('🕷 Não era gente: o casulo era isca! Os filhotes saem de dentro da seda.', '#ffb0a0'); return; }
    K.som('corta'); K.karma(2); K.xp(0.02); const ouro = Math.random() < 0.35 ? 3 + Math.floor(Math.random() * 9) : 0; if (ouro) K.gold(ouro);
    K.log(`✂ Você corta a teia. ${GRATO[Math.floor(Math.random() * GRATO.length)]}${ouro ? ` (+${ouro} de ouro, tudo o que ela tinha no bolso)` : ''} O karma registra o gesto.`, '#c8f0c0'); }
  return { perto, soltar, get total() { return list.length; }, lista: () => list.map((p) => ({ x: p.x, z: p.z, livre: performance.now() < p.back })) };
}
