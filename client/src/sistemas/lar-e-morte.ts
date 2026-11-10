/* FONTE-LAR, MORTE E RENASCIMENTO: a fonte de casa, voltar ao lar, o painel da morte, a espera do servidor, o lugar sagrado, o limiar e o retrato da cabeça. Saiu do main.ts (02/11). */
import { TILE_M as T } from '@karmika/shared';
import { heightAt } from '../world';
import * as THREE from 'three';
import { MAX_BREATHS, FRAY_LVL, type Life } from '../soul';
import { playDeath } from '../hud';
import { soulSpark, type LimiarInfo } from '../limiar';
import { PATHS } from '../vidente';
import type { LarMorteCtx } from '../main';

/* ---------- fonte-lar, morte e renascimento; Deusa dos Caminhos: Pergaminho do Regresso ---------- */
export type Home = { x: number; y: number; name: string };
export function createLarMorte(K: LarMorteCtx) {
const HOME_KEY = 'karmika.home.v1';
const defaultHome = (): Home => { const o = K.profile?.origin ?? 'human'; if (o !== 'human') { const s0 = K.city.starts[o]; return { x: s0.x, y: s0.y, name: s0.name }; } const f = K.city.props.find((p) => p.kind === 'fountain' && !p.variant)!; return { x: f.gx + 1, y: f.gy + 3, name: 'Karmika' }; };
let home: Home = (() => { try { const h = JSON.parse(localStorage.getItem(HOME_KEY) || 'null'); return h && Number.isFinite(h.x) && Number.isFinite(h.y) ? h : defaultHome(); } catch { return defaultHome(); } })(); /* 28/10: fonte-lar estragada (sem x/y) volta para o berço em vez de travar o jogo */
/* cada um acorda no seu berço (ou na fonte-lar que escolheu) */
if (K.profile) { K.state.fx = home.x; K.state.fy = home.y; K.objs.update(K.state.fx * T, K.state.fy * T, true); K.heroY = heightAt(K.state.fx * T, K.state.fy * T); K.camX = K.state.fx * T; K.camZ = K.state.fy * T; K.camY = K.heroY; }
const fountainName = (p: { gx: number; gy: number }) => K.city.settlements.find((st) => Math.hypot(st.x - p.gx, st.y - p.gy) < st.radius + 2)?.name ?? 'Karmika';
function setHome(p: { gx: number; gy: number; h: number }) { K.feats.bump('homes'); home = { x: p.gx + p.h / 2, y: p.gy + p.h + 1, name: fountainName(p) }; localStorage.setItem(HOME_KEY, JSON.stringify(home)); K.game.logMsg(`⛲ ${home.name} agora é seu lar: ao desencarnar, você renasce aqui.`, '#8ad0ff'); }
/** põe o herói num lugar sem tela de carregamento (a luz branca do Limiar cobre a troca) */
/** morreu ou foi levado lá dentro (masmorra, cripta, casa): sai do interior sem tela de carregamento */
/** solta da GPU tudo que uma subárvore descartada tinha (geometria, materiais e as texturas próprias deles) */
function disposeTree(root: THREE.Object3D) { const seen = new Set<THREE.Material>(); root.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; if (!m.geometry?.userData?.shared) m.geometry?.dispose(); for (const mt of Array.isArray(m.material) ? m.material : [m.material]) { if (!mt || seen.has(mt)) continue; seen.add(mt); if (!(mt as THREE.Material & { userData: { shared?: boolean } }).userData?.shared) { const tm = mt as THREE.MeshToonMaterial; if (tm.map && tm.map.userData?.own) tm.map.dispose(); mt.dispose(); } } }); }
function leaveInteriorNow() { if (!K.inside) return; const ins = K.inside; if (ins.dg) K.dgs.stop(); if (ins.crypt) { K.game.enemies.clearTag('crypt'); K.cryptInt = null; K.bishop = null; if (K.spirit) { K.scene.remove(K.spirit.root); K.spirit = null; } }
  K.scene.remove(ins.int.group); disposeTree(ins.int.group); /* interiores são montados a cada entrada: sem isto a GPU acumulava geometria/texturas */ K.inside = null; K.objs.group.visible = true; K.decoOut.visible = true; K.decoOthers.visible = true; K.decoCancel(); for (const n of K.npcSys.npcs) n.hero.root.visible = true; }
function placeAt(why: string, to: { x: number; y: number } = home) { leaveInteriorNow(); K.state.fx = to.x; K.state.fy = to.y; K.state.path = []; K.objs.update(K.state.fx * T, K.state.fy * T, true); K.heroY = heightAt(K.state.fx * T, K.state.fy * T); K.camX = K.state.fx * T; K.camZ = K.state.fy * T; K.camY = K.heroY; K.game.logMsg(why, '#8ad0ff'); for (let i = 0; i < 40; i++) K.particles.spawn(K.state.fx * T, 0.5, K.state.fy * T, { vx: (Math.random() - 0.5) * 3, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 3, life: 1, s0: 0.3, s1: 0.05, c0: 0xfff0bd, c1: 0x8f7bff, a: 1 }); }
function goHome(why: string, to: { x: number; y: number } = home) { K.withFade(() => placeAt(why, to)); }
K.game.setOnDeath((revive) => { K.feats.bump('deaths'); K.soul.regen();
  const fall = (note?: string, left?: number) => { const after = () => { goHome(`⛲ Você renasce na fonte de ${home.name}.`); setTimeout(() => { revive(); if (note) K.game.logMsg(note, '#c9a0ff'); }, 400); };
    /* 26/10 (Erling): o corpo cai, o Olho vira Ampulheta, e a gente fica ali, morto, vendo a cena — até clicar e escolher ressurgir na cidade */
    const sub = left === undefined ? `O Olho guarda o que viu${K.profile ? `, <b>${K.profile.name}</b>` : ''}.` : left > 0 ? `O Fio da Vida perde um fôlego. Restam <b>${left}</b> de ${MAX_BREATHS}.` : 'Era o último fôlego. Se cair de novo, a alma desencarna.';
    deathPanel(sub, () => { if (K.profile?.eye) playDeath(K.profile.name, home.name, after, { title: 'Você ressurge', sub }); else after(); }); };
  /* Fio da Vida: antes do Olho abrir (nível 15) não se desgasta; com fôlego é só uma queda; sem fôlego a alma desencarna */
  if (!K.profile || K.game.st.lvl < FRAY_LVL || !K.profile.eye) { fall(); return; } /* o Fio só se gasta depois que o Olho abre (nível 15) */
  if (K.soul.s.breaths > 0) { K.soul.s.breaths--; K.soul.save(); const b = K.soul.s.breaths;
    fall(b > 0 ? `🕯 Fio da Vida: restam ${b} de ${MAX_BREATHS} fôlegos. Um volta a cada dia.` : '🕯 Fio da Vida: este era o último fôlego. Se cair de novo antes de um voltar, a alma desencarna.', b); return; }
  K.soul.s.pending = 'choose'; K.soul.save(); K.limiar.prepare(); K.audio.soulRise(0.3);
  /* a faísca sai do corpo, cresce, vibra e sobe como uma agulha até o céu; a tela esmaece e a alma chega ao centro do labirinto */
  setTimeout(() => soulSpark(K.scene, K.hero.root.position.clone(), { burst: (x, y, z, c0, c1) => K.particles.spawn(x, y, z, { vx: (Math.random() - 0.5) * 0.8, vy: Math.random() * 0.6, vz: (Math.random() - 0.5) * 0.8, life: 0.7, s0: 0.35, s1: 0.04, c0, c1, a: 1 }),
    rise: () => { /* o som já está correndo */ }, fade: (a) => { soulFade.style.opacity = String(a); }, done: () => { unbind(revive); setTimeout(() => { soulFade.style.opacity = '0'; }, 400); } }), 300);
});
/** o painel de quem caiu: a cena continua atrás (em cinza), e só o jogador decide a hora de ressurgir */
function deathPanel(sub: string, go: () => void) {
  document.getElementById('deathp')?.remove(); const d = document.createElement('div'); d.id = 'deathp';
  d.innerHTML = `<h2>Você caiu</h2><p>${sub}</p><button>⛲ Ressurgir em ${home.name}</button><small>Enter ou clique quando quiser</small>`;
  document.body.appendChild(d); requestAnimationFrame(() => setTimeout(() => d.classList.add('on'), 900));
  let done = false; const fire = () => { if (done) return; done = true; removeEventListener('keydown', key, true); d.classList.remove('on'); setTimeout(() => d.remove(), 400); go(); };
  const key = (e: KeyboardEvent) => { if (e.key === 'Enter' && d.classList.contains('on')) { e.preventDefault(); e.stopPropagation(); fire(); } }; addEventListener('keydown', key, true);
  d.querySelector('button')!.addEventListener('click', (e) => { e.stopPropagation(); fire(); });
}
/* a tela de espera da sala: contagem, esmaece, o Olho carregando, barra da atualização, e volta ao mundo quando a sala responde */
const srvWait = (() => {
  const el = document.createElement('div'); el.id = 'srvwait'; el.innerHTML = '<div class="ldr"><div class="ldr-eye"><i></i></div><b></b><small></small><div class="in-bar" style="display:none"><i></i><span></span></div></div>'; document.body.appendChild(el);
  const B = el.querySelector('b') as HTMLElement, S = el.querySelector('small') as HTMLElement, bar = el.querySelector('.in-bar') as HTMLElement, barI = bar.querySelector('i') as HTMLElement, barS = bar.querySelector('span') as HTMLElement;
  let mode: 'off' | 'count' | 'wait' | 'upd' = 'off', cdT = 0;
  const show = (on: boolean) => { el.classList.toggle('on', on); };
  const desk = (window as unknown as { karmikaDesktop?: { update?(inv: string): Promise<{ ok: boolean; updated?: boolean; why?: string }>; onUpdate?(cb: (p: { got: number; total: number; file: string; n: number }) => void): () => void } }).karmikaDesktop ?? null;
  const inviteNow = () => K.net.state !== 'off' ? `karmika://${K.net.address}/${K.net.code}` : K.hub.invite;
  return {
    countdown(sec: number, what: string) { if (mode === 'upd') return; mode = 'count'; cdT = performance.now(); if (sec > 0) { K.game.logMsg(`⟳ ${what} em ${sec} s. Fique onde está: você volta sozinho.`, '#ffd24a'); B.textContent = `${what} em ${sec} s`; S.textContent = 'o mundo volta sozinho, com todo mundo'; bar.style.display = 'none'; show(sec <= 5); } },
    wait(txt: string) { mode = 'wait'; B.textContent = txt; S.textContent = 'a sala está reiniciando — pode levar alguns segundos'; bar.style.display = 'none'; show(true); },
    done() { if (mode === 'off') return; const was = mode; mode = 'off'; show(false); if (was === 'wait') { K.game.logMsg('✧ A sala voltou. Bem-vindo de volta.', '#9ad0ff');
      /* a sala pode ter voltado com o jogo novo: confere e baixa só o que mudou */ const inv = inviteNow(); if (desk?.update && inv) desk.update(inv).then((r) => { if (r.ok && r.updated) { sessionStorage.setItem('karmika.boot', JSON.stringify({ server: inv })); location.reload(); } }).catch(() => { /* */ }); } },
    async update(sec: number, version: string) { void version; if (mode === 'upd') return;
      if (sec > 0) { mode = 'count'; B.textContent = `Atualização do jogo em ${sec} s`; S.textContent = 'o mundo volta sozinho, com todo mundo'; bar.style.display = 'none'; show(sec <= 5); if (sec === 10) K.game.logMsg('⬇ O jogo vai atualizar em 10 s. Fique onde está: você volta sozinho.', '#ffd24a'); return; }
      mode = 'upd'; B.textContent = 'Atualizando Karmika'; S.textContent = 'baixando só o que mudou…'; bar.style.display = ''; barI.style.width = '0%'; barS.textContent = ''; show(true);
      const inv = inviteNow();
      if (desk?.update && inv) { const off = desk.onUpdate?.((p) => { const k = p.total ? p.got / p.total : 0; barI.style.width = `${(k * 100).toFixed(1)}%`; barS.textContent = p.total ? `${(p.got / 1048576).toFixed(1)} / ${(p.total / 1048576).toFixed(1)} MB` : 'conferindo…'; });
        const r = await desk.update(inv).catch((x) => ({ ok: false, why: String(x), updated: false })); off?.(); sessionStorage.setItem('karmika.boot', JSON.stringify({ server: inv })); if (r.ok) location.reload(); else { mode = 'off'; show(false); K.game.logMsg(`✖ Não deu para atualizar: ${(r as { why?: string }).why ?? '?'}`, '#ff8a7a'); } }
      else { /* navegador (dev): recarrega e volta para a sala */ sessionStorage.setItem('karmika.boot', JSON.stringify({ server: inv })); setTimeout(() => location.reload(), 800); } },
    tick() { if (mode !== 'count') return; if (performance.now() - cdT > 15000) { mode = 'off'; show(false); } },
  };
})();
setInterval(() => srvWait.tick(), 1000);
const soulFade = document.createElement('div'); soulFade.id = 'soulfade'; document.body.appendChild(soulFade);
const originName = (o?: string) => o === 'dwarf' ? 'Anão' : o === 'elf' ? 'Elfo' : 'Humano';
/** o lugar sagrado da classe (onde a Lágrima devolve a alma): o mestre do caminho; sem classe, a fonte do lar */
function sacredPlace(): { x: number; y: number; name: string } {
  const p = PATHS.find((x) => x.cls === K.game.classInfo.name); if (!p) return { ...home, name: `na fonte de ${home.name}` };
  const prep = ({ gue: 'na', pal: 'na', tec: 'na', lob: 'na' } as Record<string, string>)[p.id] ?? 'no', name = `${prep} ${p.place}`;
  const n = K.npcSys.npcs.find((q) => q.def.name === (p.id === 'tec' ? 'Arquiteta Ylva' : p.mentor)); if (n) return { x: n.pos.x / T + 1.5, y: n.pos.z / T + 1.5, name };
  const v = K.city.settlements.find((st) => st.name === p.village); return v ? { x: v.x, y: v.y, name } : { ...home, name: `na fonte de ${home.name}` };
}
/** a alma desencarnou: a tela das três escolhas */
function limiarInfo(): LimiarInfo { const c = K.game.classInfo;
  return { name: K.profile!.name, race: originName(K.profile!.origin), cls: c.name, clsLvl: c.lvl, lvl: K.game.st.lvl, karma: K.state.karma, kills: K.game.st.kills ?? 0, quests: K.quests.q.done.length, debt: Math.round(K.game.xpNeed() * 2), tears: K.inv.count('lagrima'), place: sacredPlace().name, lives: K.soul.s.lives.map((l) => ({ race: originName(l.origin), cls: l.cls, clsLvl: l.clsLvl })) }; }
/** a alma desencarnou: sobe ao Limiar e conversa com Orvalen e Sael */
function unbind(revive: () => void = () => { /* já de pé */ }, resume?: 'reborn') {
  if (!K.profile) return; const c = K.game.classInfo, place = sacredPlace(), info = limiarInfo();
  K.limiar.open(info, (k) => {
    K.soul.s.breaths = MAX_BREATHS; K.soul.s.regenAt = Date.now(); K.soul.s.pending = null;
    if (k === 'corpo') { K.soul.s.debt += info.debt; K.soul.save(); revive(); placeAt(`⛲ A alma volta ao mesmo corpo, em ${home.name}. Dívida Kármica: ${K.soul.s.debt.toLocaleString('pt-BR')} XP.`); return; }
    if (k === 'lagrima') { K.inv.take('lagrima', 1); revive(); placeAt(`💧 A Lágrima paga a volta. A alma de ${K.profile!.name} reencontra o corpo ${place.name}.`, place); dispatchEvent(new CustomEvent('karmika:burst', { detail: { c0: 0xffffff, c1: 0x9ad7ff, n: 80 } })); return; }
    if (resume !== 'reborn') { const life: Life = { name: K.profile!.name, origin: K.profile!.origin, cls: c.name, clsLvl: c.lvl, lvl: K.game.st.lvl, karma: Math.round(K.state.karma), luz: Math.round(K.soul.s.luzT ?? 0), sombra: Math.round(K.soul.s.sombraT ?? 0), end: 'reencarne', at: Date.now() };
      K.soul.s.lives.push(life); K.soul.s.luzT = 0; K.soul.s.sombraT = 0; K.soul.s.outcast = null; K.soul.s.madness = null; /* o acumulado é desta vida: sobe sem teto até desencarnar, e fica escrito na vida passada */ K.soul.s.catchup = { cls: c.name, until: Math.max(c.lvl, K.soul.s.catchup?.cls === c.name ? K.soul.s.catchup.until : 0) }; }
    K.soul.s.pending = 'reborn'; K.soul.save(); revive(); K.showCreate(true);
  }, { stage: resume });
}
/** voltou ao jogo no meio de um desencarne (fechou a janela): a escolha continua esperando */
/* dev: foto de perto da cabeça (testes de encaixe de elmo/chapéu) */
function headShot(yaw: number, sz = 256, dy = 0, dist = 1.6): string {
  const head = K.skinModel?.getObjectByName('mixamorigHead') ?? (K.hero as unknown as { rig?: { head: THREE.Object3D } }).rig?.head; if (!head) return '';
  K.hero.root.updateMatrixWorld(true); const c = head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.12 + dy, 0));
  const ry = K.hero.root.rotation.y + yaw, cam = new THREE.PerspectiveCamera(24, 1, 0.05, 30); cam.position.set(c.x + Math.sin(ry) * dist, c.y + 0.12, c.z + Math.cos(ry) * dist); cam.lookAt(c); cam.layers.enableAll();
  const rt = new THREE.WebGLRenderTarget(sz, sz); K.renderer.setRenderTarget(rt); K.renderer.clear(); K.renderer.render(K.scene, cam);
  const px = new Uint8Array(sz * sz * 4); K.renderer.readRenderTargetPixels(rt, 0, 0, sz, sz, px); K.renderer.setRenderTarget(null); rt.dispose();
  const cv = document.createElement('canvas'); cv.width = cv.height = sz; const g = cv.getContext('2d')!, im = g.createImageData(sz, sz);
  for (let y = 0; y < sz; y++) for (let x = 0; x < sz; x++) { const si = ((sz - 1 - y) * sz + x) * 4, di = (y * sz + x) * 4; for (let k = 0; k < 3; k++) im.data[di + k] = Math.min(255, Math.pow(px[si + k] / 255, 1 / 2.2) * 255 * 1.1); im.data[di + 3] = 255; }
  g.putImageData(im, 0, 0); return cv.toDataURL();
}
  return { leaveInteriorNow, originName, unbind, srvWait, get home() { return home; }, set home(v: typeof home) { home = v; }, placeAt, goHome, HOME_KEY, defaultHome, headShot, setHome };
}
