import * as THREE from 'three';
import { createCharacter, type Hero3D, type Kind } from './characters';
import { BARKS, roleTag } from './barks';
import { attachSkin, type SkinDef } from './skin3d';
import { WAGON_BLOCK } from './caravanas';

export interface NpcDef { /** 08/11: sexo (escolhe o modelo de arte); sem ele, pelo nome */ sex?: 'm' | 'f'; /** 08/11: NPC que vive dentro de um interior (ex.: 'hall' = o Grande Salão); x/z já no espaço do interior montado (IX+…) */ inside?: string; name: string; role: string; kind: Kind; /** aldeão comum ou elfo (modelo sem armadura) */ civil?: 'human' | 'elf'; x: number; z: number; radius: number; tint: number; scale: number; lines: string[]; /** rota (metros): o NPC anda de um extremo ao outro e volta */ route?: { x: number; z: number }[]; /** onde começa na rota (índice) e passo (m/s): a patrulha anda em coluna e mais rápido que o mercador */ ri0?: number; pace?: number; /** só à noite (some de dia) */ night?: boolean }
interface Npc { built: boolean; lodT?: number; /** 08/11: o modelo de arte vestido (skin3d) e o seu tique */ skin?: 0 | 1 | 2; skinTick?: (() => void) | null; def: NpcDef; hero: Hero3D; pos: THREE.Vector3; yaw: number; target: THREE.Vector2 | null; wait: number; el: HTMLElement; line: number; lineT: number; spd: number; ri: number; rdir: number; bark?: string; barkT?: number }

/* 06/11 (Erling: "a altura média do jogo é 1,70; o herói tem que ser maior, mais heroico"): os modelos crus medem humano/elfo civil e
   nórdico ~1,87 m, tecnocrata ~2,10 m e anão ~1,63 m. Aqui eles voltam para a média do mundo: gente 1,70 m, anão 1,40 m.
   O "scale" de cada NPC continua valendo por cima (a moça 0,92, o grandalhão 1,1). */
const KIND_NORM: Record<string, number> = { technocrat: 0.81, dwarf: 0.86 };
export const npcScale = (def: { kind: string; civil?: string; scale: number }) => def.scale * (def.civil ? 0.91 : KIND_NORM[def.kind] ?? 0.91);
export function createNpcs(scene: THREE.Scene, defs: NpcDef[], ctx: { heightAt(x: number, z: number): number; walkable(x: number, z: number): boolean; camera: THREE.Camera; canvas: HTMLCanvasElement; /** missão no diário (NPC que só aparece com ela) */ questOn?: (id: string) => boolean; /** 08/11: qual interior o herói está (null = mundo) e se um ponto dele é livre */ insideId?: () => string | null; insideFree?: (x: number, z: number) => boolean; /** o que está acontecendo (para as falas soltas) */ situ?: () => { tags: string[]; nome: string; pet: string } }) {
  /* 02/11 (Erling, item 8): o NPC só é montado quando o jogador chega na região dele (a 60 m), aos poucos (2 por quadro), o mais perto primeiro.
     Antes os ~380 bonecos eram montados todos na abertura do jogo. Até montar, ele é um marcador vazio (posição, nome, falas e rota funcionam igual). */
  const BUILD_R = 60, PER_FRAME = 2;
  function makeHero(def: NpcDef): Hero3D {
    const hero = createCharacter(def.civil ? 'nordic' : def.kind, { static: true, civil: def.civil, cloth: def.civil ? def.tint : undefined });
    hero.root.scale.setScalar(npcScale(def)); hero.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.castShadow = false; }); // NPCs sem sombra (desempenho)
    /* 08/11: gente comum anda desarmada; só guardas, soldados, caçadores e armeiros carregam arma */
    if (!/Guarda|Soldad|Capit|Patrulh|Vigia|Sentinela|Caçad|Guerreir|Armeir|Mercenári|Lenhador|Mestre-Forjador|Ferreir|Thane|Rei\b/.test(def.role + ' ' + def.name)) { try { hero.setGear({ weapon: null, shield: null }); } catch { /* */ } }
    const tint = new THREE.Color(def.tint);
    hero.root.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; const mats = Array.isArray(m.material) ? m.material : [m.material]; m.material = (mats.map((mt) => { const t = mt as THREE.MeshToonMaterial; if (!t.color || t.side === THREE.BackSide || (t as unknown as THREE.MeshBasicMaterial).isMeshBasicMaterial) return mt; const c = t.clone(); c.color.lerp(tint, 0.38); return c; }) as THREE.Material[]); const arr = m.material as unknown as THREE.Material[]; if (arr.length === 1) m.material = arr[0]; });
    return hero;
  }
  /** marcador leve até o boneco ser montado: só a raiz (invisível) e um "act" que não faz nada */
  const stub = (): Hero3D => { const root = new THREE.Group(); root.visible = false; scene.add(root); return { root, acting: false, act: () => false } as unknown as Hero3D; };
  /* 08/11 (Erling: "os NPCs anões podem ser todos personagens com roupas; não precisava mais ser bonecos blocados; os que acompanham as carroças também"):
     o NPC ganha o MODELO DE ARTE vestido quando chega a 30 m do herói — anão e anã (lvl01; mestres, reis e guardas reais com o lvl02), humanos e humanas
     comuns (humano_2/humana_2), elfos. O procedural continua por baixo movendo o esqueleto; o modelo só acompanha. Longe, nem anima. */
  const FEM = /a$|ís$|ún$|úd$|^Eir$|^Hildr$|^Brynja$|^Ásta$|^Yrsa$|^Teresa$|^Luísa$|^Lúcia$|^Maren$|^Tessa$|^Rosália$|^Kaela$|^Morwen$/;
  const npcSkin = (d: NpcDef): SkinDef | null => { const first = d.name.replace(/^(Mestre-Forjador|Mestre-Mineiro|Mestre-Fundidor|Mestra|Mestre|Guarda Real|Guarda|Sangradora|Domadora|Armeiro|Armadureira|Mercadora|Mercador|Taverneiro|Alquimista|Mineira|Mineiro|Aprendiz|Cervejeira|Anciã|Pequeno|Carregador|Conselheira|Fundidora|Ferreiro|Ferreira|Vendedora|Vendedor|Escriba|Comendador|Rei|Thane|Velha|Capataz|Barqueira|Guarda-Passo|Caçador|Curandeira|Vigia|Pastora|Cronista|Juíza|Patrulheira|Soldado|Soldada|Capitã|Capitão)\s+/, '').split(' ')[0];
    const fem = d.sex ? d.sex === 'f' : FEM.test(first) || FEM.test(d.name.split(' ')[0]);
    if (d.kind === 'dwarf') { const elite = /^(Rei|Mestre|Guarda Real|Thane|Conselheira)/.test(d.name); return { fbx: `/models/personagens/anao_${fem ? 'm' : 'h'}_lvl0${elite ? 3 : 2}.glb`, tex: '' }; } /* lvl02 = vestido de couro; lvl03 = com armadura */
    if (d.civil === 'elf') return { fbx: `/models/personagens/elfo_${fem ? 'm' : 'h'}_lvl02.glb`, tex: '' };
    if (d.civil === 'human' || (d.kind === 'nordic' && !/Guarda|Soldad|Capit|Patrulh|Vigia|Sentinela/.test(d.role))) return { fbx: `/models/personagens/humano_${fem ? 'm' : 'h'}_lvl02.glb`, tex: '' };
    return null; };
  const SKIN_R = 30;
  function skinNear(n: Npc, dH: number) { if (n.skin || dH > SKIN_R || n.def.route) return; const def = npcSkin(n.def); if (!def) { n.skin = 2; return; } n.skin = 1; const h = n.hero;
    attachSkin(h, def).then((r) => { if (!r) { n.skin = 2; return; } if (n.hero !== h) { h.root.remove(r.model); n.skin = 0; return; } r.model.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = false; m.receiveShadow = true; } }); n.skinTick = r.tick; }).catch(() => { n.skin = 2; }); }
  function build(n: Npc) { if (n.built) return; n.built = true; n.skin = 0; n.skinTick = null; const was = n.hero.root; const h = makeHero(n.def); h.root.visible = was.visible; h.root.position.copy(n.pos); h.root.rotation.y = n.yaw; scene.remove(was); scene.add(h.root); n.hero = h; }
  const npcs: Npc[] = defs.map((def) => {
    const hero = stub();
    const el = document.createElement('div'); el.className = 'npc'; el.innerHTML = `<i class="qm"></i><b>${def.name}</b><small>${def.role}</small><p></p>`; document.body.appendChild(el);
    const pos = new THREE.Vector3(def.x, 0, def.z);
    const ri = def.route ? (def.ri0 !== undefined ? Math.min(def.route.length - 1, def.ri0) : Math.floor(Math.random() * def.route.length)) : 0; if (def.route) pos.set(def.route[ri].x, 0, def.route[ri].z);
    return { def, hero, pos, yaw: Math.random() * 6.28, target: null, wait: Math.random() * 3, el, line: 0, lineT: 0, spd: 0, ri, rdir: 1, built: false };
  });
  let firstBuild = true;
  /** monta os NPCs da região do jogador: na primeira chamada (tela de carregamento) todos de uma vez; depois 2 por quadro */
  function buildNear(heroPos: THREE.Vector3) {
    const want: [Npc, number][] = []; for (const n of npcs) { if (n.built) continue; const dd = Math.hypot(heroPos.x - n.pos.x, heroPos.z - n.pos.z); if (dd < BUILD_R) want.push([n, dd]); }
    if (!want.length) { firstBuild = false; return; } want.sort((a, b) => a[1] - b[1]); const k = firstBuild ? want.length : Math.min(PER_FRAME, want.length); for (let i = 0; i < k; i++) build(want[i][0]); firstBuild = false;
  }
  const v = new THREE.Vector3();
  /* falas soltas: uma de cada vez, a cada 8–16 s, de alguém entre 3 e 18 m; a situação mais específica pesa mais */
  let barkT = 5; const recent: string[] = [];
  function pickBark(n: Npc) { const S = ctx.situ?.(); if (!S) return null; const rt = roleTag(n.def.role); const tags = [...S.tags, ...(rt ? [rt, rt] : [])].filter((k) => BARKS[k]);
    if (!tags.length) return null; for (let tries = 0; tries < 6; tries++) { const tg = tags[Math.floor(Math.random() * tags.length)], L = BARKS[tg], l = L[Math.floor(Math.random() * L.length)]; if (recent.includes(l)) continue; recent.push(l); if (recent.length > 14) recent.shift(); return l.replace(/\{nome\}/g, S.nome).replace(/\{pet\}/g, S.pet || 'bichinho'); } return null; }
  let placed = false;
  function update(dt: number, t: number, heroPos: THREE.Vector3, night: number, gust: number) {
    const r = ctx.canvas.getBoundingClientRect(); buildNear(heroPos);
    if (!placed) { placed = true; /* regra 19 (27/10): NPC nunca fica dentro de parede nem em cima de mobília — se o lugar marcado está ocupado, vai para o chão livre mais perto */
      for (const n of npcs) { const d = n.def; if (d.route || d.inside || ctx.walkable(n.pos.x, n.pos.z)) continue; let ok = false; for (let rr = 0.6; rr <= 6 && !ok; rr += 0.6) for (let k = 0; k < 12 && !ok; k++) { const a = k / 12 * 6.283 + rr, x = d.x + Math.cos(a) * rr, z = d.z + Math.sin(a) * rr; if (ctx.walkable(x, z)) { n.pos.set(x, 0, z); d.x = x; d.z = z; ok = true; } } } }
    barkT -= dt; if (barkT <= 0) { barkT = 8 + Math.random() * 8; const cand = npcs.filter((n) => n.hero.root.visible && !n.def.route && !(n.barkT && n.barkT > 0)).filter((n) => { const dd = Math.hypot(heroPos.x - n.pos.x, heroPos.z - n.pos.z); return dd > 3 && dd < 18; });
      if (cand.length) { const n = cand[Math.floor(Math.random() * cand.length)], l = pickBark(n); if (l) { n.bark = l; n.barkT = 4.8; } } }
    /* 26/10 noite (Erling: "dois NPCs grudados um dentro do outro"): ninguém ocupa o mesmo lugar. Quem está perto demais
       é empurrado para fora devagar (quem anda numa rota de patrulha cede menos), sempre para chão andável. */
    { const vis = npcs.filter((n) => n.hero.root.visible);
      for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) { const a = vis[i], b = vis[j], min = 0.85 * Math.max(npcScale(a.def), npcScale(b.def)) + 0.25;
        let dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, l = Math.hypot(dx, dz); if (l >= min) continue;
        if (l < 1e-3) { const g = (i * 7 + j * 13) % 6.283; dx = Math.cos(g); dz = Math.sin(g); l = 1; }
        const push = Math.min(min - l, 2.5 * dt + (min - l) * 0.2), ka = a.def.route ? 0.15 : b.def.route ? 0.85 : 0.5, kb = 1 - ka;
        const ax = a.pos.x - dx / l * push * ka, az = a.pos.z - dz / l * push * ka, bx = b.pos.x + dx / l * push * kb, bz = b.pos.z + dz / l * push * kb;
        if (ctx.walkable(ax, az)) { a.pos.x = ax; a.pos.z = az; } if (ctx.walkable(bx, bz)) { b.pos.x = bx; b.pos.z = bz; }
        /* quem estava parado ali arruma outro canto para ficar */
        if (!a.def.route && !a.target) a.wait = Math.min(a.wait, 0.5); if (!b.def.route && !b.target) b.wait = Math.min(b.wait, 0.5); } }
    const here = ctx.insideId?.() ?? null;
    const walk = (n: Npc, x: number, z: number) => n.def.inside ? (ctx.insideFree?.(x, z) ?? true) : ctx.walkable(x, z);
    for (const n of npcs) {
      const d = n.def, dH = Math.hypot(heroPos.x - n.pos.x, heroPos.z - n.pos.z);
      if ((d.inside ?? null) !== here) { n.hero.root.visible = false; if (n.el.style.display !== 'none') n.el.style.display = 'none'; continue; } /* NPC de interior só aparece dentro dele; os de fora somem lá dentro */
      if ((d as NpcDef & { onlyQ?: string }).onlyQ && !ctx.questOn?.((d as NpcDef & { onlyQ?: string }).onlyQ!)) { n.hero.root.visible = false; if (n.el.style.display !== 'none') n.el.style.display = 'none'; continue; }
      if (d.night && night < 0.45) { n.hero.root.visible = false; if (n.el.style.display !== 'none') n.el.style.display = 'none'; continue; } // a Corte só recebe à noite
      if (dH > 48 || !n.built) { n.hero.root.visible = false; if (n.el.style.display !== 'none') n.el.style.display = 'none'; continue; } // longe: nem anima nem desenha
      if (!n.hero.root.visible) { n.hero.root.visible = true; n.pos.y = d.inside ? 0 : ctx.heightAt(n.pos.x, n.pos.z); n.hero.root.position.copy(n.pos); }
      skinNear(n, dH);
      let mps = 0, head: number | null = null;
      if (d.route && dH >= 4.5) { // caravana: segue a estrada de um extremo ao outro
        const r0 = d.route; const tg = r0[n.ri]; const dx = tg.x - n.pos.x, dz = tg.z - n.pos.z, l = Math.hypot(dx, dz);
        if (l < 0.6) { n.ri += n.rdir; if (n.ri >= r0.length || n.ri < 0) { n.rdir *= -1; n.ri += n.rdir * 2; n.wait = 6; } }
        else if (n.wait > 0) n.wait -= dt; else { const pace = d.pace ?? 1.5, sp = pace * dt; n.pos.x += dx / l * sp; n.pos.z += dz / l * sp; mps = pace; n.yaw = Math.atan2(dx, dz); head = n.yaw; }
      } else if (dH < 4.5) { // olha para o herói
        n.target = null; const w = Math.atan2(heroPos.x - n.pos.x, heroPos.z - n.pos.z); let df = w - n.yaw; while (df > Math.PI) df -= 6.283; while (df < -Math.PI) df += 6.283; n.yaw += df * Math.min(1, dt * 5); head = n.yaw;
      } else if (n.target) {
        const dx = n.target.x - n.pos.x, dz = n.target.y - n.pos.z, l = Math.hypot(dx, dz);
        if (l < 0.3) { n.target = null; n.wait = 2 + Math.random() * 5; } else {
          const sp = 1.2 * dt, nx = n.pos.x + dx / l * sp, nz = n.pos.z + dz / l * sp;
          if (walk(n, nx, nz)) { n.pos.x = nx; n.pos.z = nz; mps = 1.2; n.yaw = Math.atan2(dx, dz); head = n.yaw; } else n.target = null;
        }
      } else {
        n.wait -= dt;
        if (n.wait <= 0) { const a = Math.random() * 6.283, rr = Math.random() * d.radius; const tx = d.x + Math.cos(a) * rr, tz = d.z + Math.sin(a) * rr; if (walk(n, tx, tz) && !npcs.some((o) => o !== n && o.hero.root.visible && Math.hypot(o.pos.x - tx, o.pos.z - tz) < 1.2)) n.target = new THREE.Vector2(tx, tz); else n.wait = 1; }
      }
      /* 09/11 (Erling: "a carroça atravessando ela"): carroça é corpo. Se uma passa por cima do NPC, ele dá um passo para o lado (para fora da caixa) */
      if (!d.inside && WAGON_BLOCK.length) for (const b of WAGON_BLOCK) { const dx = n.pos.x - b.x, dz = n.pos.z - b.z; if (dx * dx + dz * dz > 64) continue; const sn = Math.sin(b.yaw), cs = Math.cos(b.yaw), lx = dx * cs - dz * sn, lz = dx * sn + dz * cs - b.zc;
        if (Math.abs(lx) < b.hw + 0.5 && Math.abs(lz) < b.hl + 0.3) { const side = lx >= 0 ? 1 : -1, want = side * (b.hw + 0.6), step = Math.min(Math.abs(want - lx), dt * 2.2) * side; const nx = n.pos.x + step * cs, nz = n.pos.z - step * sn; if (walk(n, nx, nz)) { n.pos.x = nx; n.pos.z = nz; mps = Math.max(mps, 0.8); } break; } }
      n.pos.y = d.inside ? 0 : ctx.heightAt(n.pos.x, n.pos.z);
      n.hero.root.position.copy(n.pos);
      n.hero.setNight(night); n.hero.setWind(gust);
      if (dH < 30 || mps > 0 || (n.lodT = (n.lodT ?? 0) + dt) > 0.25) { n.lodT = 0; n.hero.update(dH < 30 ? dt : 0.25, t, mps, head); n.skinTick?.(); } /* FPS (27/10): quem está parado e longe anima a 4 quadros por segundo */
      n.hero.root.rotation.y = n.yaw;
      // nome e fala
      v.set(n.pos.x, n.pos.y + 2.3 * npcScale(d), n.pos.z).project(ctx.camera);
      const show = dH < 22 && v.z < 1;
      n.el.style.display = show ? 'block' : 'none';
      if (show) {
        n.el.style.left = r.left + (v.x * 0.5 + 0.5) * r.width + 'px'; n.el.style.top = r.top + (-v.y * 0.5 + 0.5) * r.height + 'px';
        const p = n.el.querySelector('p') as HTMLElement;
        if (n.barkT && n.barkT > 0) { n.barkT -= dt; { const tx = n.bark ?? ''; if (p.textContent !== tx) p.textContent = tx; } if (p.style.display !== 'block') p.style.display = 'block'; p.classList.add('bark'); }
        else if (dH < 6) { p.classList.remove('bark'); n.lineT += dt; if (n.lineT > 4.5) { n.lineT = 0; n.line = (n.line + 1) % d.lines.length; if (Math.random() < 0.3) { const l = pickBark(n); if (l) { n.bark = l; n.barkT = 4.5; } } } { const tx = d.lines[n.line]; if (p.textContent !== tx) p.textContent = tx; } p.style.display = 'block'; } else { p.classList.remove('bark'); p.style.display = 'none'; n.lineT = 4; }
      }
    }
  }
  const talk = (n: Npc) => { n.line = (n.line + 1) % n.def.lines.length; n.lineT = 0; return n.def.lines[n.line]; };
  /** fala forçada (recepção, festa): o NPC visível mais perto do herói, entre 2 e 14 m, diz a linha */
  function say(line: string, heroPos: THREE.Vector3) { let best: Npc | null = null, bd = 14; for (const n of npcs) { if (!n.hero.root.visible || n.def.route) continue; const dd = Math.hypot(heroPos.x - n.pos.x, heroPos.z - n.pos.z); if (dd > 2 && dd < bd) { bd = dd; best = n; } } if (best) { best.bark = line; best.barkT = 5; } return !!best; }
  /** monta já (quem precisa do boneco de verdade longe do jogador: retrato, festa) */
  const ensure = (n: Npc) => build(n);
  return { npcs, update, talk, say, ensure, builtCount: () => npcs.filter((n) => n.built).length };
}
