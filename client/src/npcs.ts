import * as THREE from 'three';
import { createCharacter, type Hero3D, type Kind } from './characters';
import { BARKS, roleTag, FAMA, GOSSIP, GOSSIP_DEED, GUARD_CRY } from './barks';
import { attachSkin, type SkinDef } from './skin3d';
import { WAGON_BLOCK } from './caravanas';
/** o ponto (metros) cai dentro da caixa de alguma carroça, com folga? */
function inWag(x: number, z: number, pad: number): boolean { for (const b of WAGON_BLOCK) { const dx = x - b.x, dz = z - b.z; if (dx * dx + dz * dz > 64) continue; const sn = Math.sin(b.yaw), cs = Math.cos(b.yaw), lx = dx * cs - dz * sn, lz = dx * sn + dz * cs - b.zc; if (Math.abs(lx) < b.hw + pad && Math.abs(lz) < b.hl + pad) return true; } return false; }

export interface NpcDef { /** 10/11: sentado (banco/cadeira) olhando para `yaw`; bebe de vez em quando. Não sai do lugar */ seat?: { yaw: number; h: number }; /** 09/11: altura acima do chão (os soldados em cima da plataforma do portão) */ yOff?: number; /** 09/11: fica onde foi posto (ex.: a Inês em cima da ponte; o chão do tabuleiro não conta como andável para o NPC) */ fixed?: boolean; /** 08/11: sexo (escolhe o modelo de arte); sem ele, pelo nome */ sex?: 'm' | 'f'; /** 08/11: NPC que vive dentro de um interior (ex.: 'hall' = o Grande Salão); x/z já no espaço do interior montado (IX+…) */ inside?: string; name: string; role: string; kind: Kind; /** aldeão comum ou elfo (modelo sem armadura) */ civil?: 'human' | 'elf'; x: number; z: number; radius: number; tint: number; scale: number; lines: string[]; /** rota (metros): o NPC anda de um extremo ao outro e volta */ route?: { x: number; z: number }[]; /** onde começa na rota (índice) e passo (m/s): a patrulha anda em coluna e mais rápido que o mercador */ ri0?: number; pace?: number; /** só à noite (some de dia) */ night?: boolean }
interface Npc { built: boolean; lodT?: number; /** 08/11: o modelo de arte vestido (skin3d) e o seu tique */ skin?: 0 | 1 | 2; skinTick?: (() => void) | null; def: NpcDef; hero: Hero3D; pos: THREE.Vector3; yaw: number; target: THREE.Vector2 | null; wait: number; el: HTMLElement; line: number; lineT: number; spd: number; ri: number; rdir: number; bark?: string; barkT?: number }

/* 06/11 (Erling: "a altura média do jogo é 1,70; o herói tem que ser maior, mais heroico"): os modelos crus medem humano/elfo civil e
   nórdico ~1,87 m, tecnocrata ~2,10 m e anão ~1,63 m. Aqui eles voltam para a média do mundo: gente 1,70 m, anão 1,40 m.
   O "scale" de cada NPC continua valendo por cima (a moça 0,92, o grandalhão 1,1). */
const KIND_NORM: Record<string, number> = { technocrat: 0.81, dwarf: 0.86 };
/* 09/11 (Erling: "os NPCs no geral estão pequenos demais; o anão ficou deveras pequeno"): o modelo de arte é encaixado pelo quadril do boneco,
   e saía menor que o próprio boneco (gente com a cabeça a 1,35 m, anão a 0,88 m, o herói a 1,62 m). Medido no jogo: gente +12%, anão +35%. */
const ART_HUMAN = 1.12, ART_DWARF = 1.35;
export const npcScale = (def: { kind: string; civil?: string; scale: number }) => def.scale * (def.civil ? 0.91 : KIND_NORM[def.kind] ?? 0.91);
/** 10/11: o que a guarda precisa saber de um bicho (enemies.ts) */
export interface GThreat { pos: THREE.Vector3; alive: boolean; active: boolean; hpMax: number; def: { passive?: boolean; radius?: number; name: string }; foe?: { pos: THREE.Vector3; alive(): boolean; hit(n: number): void } }
const GUARD_RX = /^(Guarda|Capit[ãa]o|Vigia|Sentinela|Soldad|Patrulh|Sargento)/;
export function createNpcs(scene: THREE.Scene, defs: NpcDef[], ctx: { /** 10/11: os bichos ativos perto (a guarda luta com eles) e o golpe do guarda */ threats?(): GThreat[]; hitThreat?(e: GThreat, n: number, from: THREE.Vector3): void; /** 10/11: karma do herói (a fofoca) */ karma?(): number; heightAt(x: number, z: number): number; walkable(x: number, z: number): boolean; camera: THREE.Camera; canvas: HTMLCanvasElement; /** missão no diário (NPC que só aparece com ela) */ questOn?: (id: string) => boolean; /** 08/11: qual interior o herói está (null = mundo) e se um ponto dele é livre */ insideId?: () => string | null; insideFree?: (x: number, z: number) => boolean; /** o que está acontecendo (para as falas soltas) */ situ?: () => { tags: string[]; nome: string; pet: string } }) {
  /* 02/11 (Erling, item 8): o NPC só é montado quando o jogador chega na região dele (a 60 m), aos poucos (2 por quadro), o mais perto primeiro.
     Antes os ~380 bonecos eram montados todos na abertura do jogo. Até montar, ele é um marcador vazio (posição, nome, falas e rota funcionam igual). */
  const BUILD_R = 60, PER_FRAME = 2;
  function makeHero(def: NpcDef): Hero3D {
    const hero = createCharacter(def.civil ? 'nordic' : def.kind, { static: true, civil: def.civil, cloth: def.civil ? def.tint : undefined });
    hero.root.scale.setScalar(npcScale(def)); hero.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.castShadow = false; }); // NPCs sem sombra (desempenho)
    /* 08/11: gente comum anda desarmada; só guardas, soldados, caçadores e armeiros carregam arma */
    if (!/Guarda|Soldad|Capit|Patrulh|Vigia|Sentinela|Caçad|Guerreir|Armeir|Mercenári|Lenhador|Mestre-Forjador|Ferreir|Thane|Rei\b/.test(def.role + ' ' + def.name)) { try { hero.setGear({ weapon: null, shield: null }); } catch { /* */ } }
    const tint = new THREE.Color(def.tint);
    hero.root.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; const mats = Array.isArray(m.material) ? m.material : [m.material]; m.material = (mats.map((mt) => { const t = mt as THREE.MeshToonMaterial; if (!t.color || t.side === THREE.BackSide || (t as unknown as THREE.MeshBasicMaterial).isMeshBasicMaterial) return mt; const hsl = { h: 0, s: 0, l: 0 }; t.color.getHSL(hsl); if (hsl.l > 0.5 && hsl.h > 0.02 && hsl.h < 0.13 && hsl.s > 0.2) return mt; /* 09/11 (Erling: "a cara da juíza parece um zumbi"): a PELE não recebe a cor do NPC — só a roupa (o vinho da Hulda deixava o rosto morto) */ const c = t.clone(); c.color.lerp(tint, 0.38); return c; }) as THREE.Material[]); const arr = m.material as unknown as THREE.Material[]; if (arr.length === 1) m.material = arr[0]; });
    return hero;
  }
  /** marcador leve até o boneco ser montado: só a raiz (invisível) e um "act" que não faz nada */
  const stub = (): Hero3D => { const root = new THREE.Group(); root.visible = false; scene.add(root); return { root, acting: false, act: () => false } as unknown as Hero3D; };
  /* 08/11 (Erling: "os NPCs anões podem ser todos personagens com roupas; não precisava mais ser bonecos blocados; os que acompanham as carroças também"):
     o NPC ganha o MODELO DE ARTE vestido quando chega a 30 m do herói — anão e anã (lvl01; mestres, reis e guardas reais com o lvl02), humanos e humanas
     comuns (humano_2/humana_2), elfos. O procedural continua por baixo movendo o esqueleto; o modelo só acompanha. Longe, nem anima. */
  const FEM = /a$|ís$|ún$|úd$|^Eir$|^Hildr$|^Brynja$|^Ásta$|^Yrsa$|^Teresa$|^Luísa$|^Lúcia$|^Maren$|^Tessa$|^Rosália$|^Kaela$|^Morwen$|^Inês$/;
  const npcSkin = (d: NpcDef): SkinDef | null => { const first = d.name.replace(/^(Mestre-Forjador|Mestre-Mineiro|Mestre-Fundidor|Mestra|Mestre|Guarda Real|Guarda|Sangradora|Domadora|Armeiro|Armadureira|Mercadora|Mercador|Taverneiro|Alquimista|Mineira|Mineiro|Aprendiz|Cervejeira|Anciã|Pequeno|Carregador|Conselheira|Fundidora|Ferreiro|Ferreira|Vendedora|Vendedor|Escriba|Comendador|Rei|Thane|Velha|Capataz|Barqueira|Guarda-Passo|Caçador|Curandeira|Vigia|Pastora|Cronista|Juíza|Patrulheira|Soldado|Soldada|Capitã|Capitão)\s+/, '').split(' ')[0];
    /* 09/11 (Erling: "a Anciã é um homem jovem, nada a ver"): o título e o ofício dizem antes do nome — Anciã, Guardiã, Patrulheira, Rainha…
       ou "· élfica / humana / anã / nórdica" no ofício são mulher; "· élfico / humano / anão / nórdico", homem */
    const t0 = d.name.split(' ')[0], rl = d.role ?? '';
    const femT = /^(Anciã|Guardiã|Patrulheira|Rainha|Senhora|Irmã|Cantora|Mestra|Dona|Madre|Sacerdotisa|Arqueira|Herborista|Taverneira|Jardineira|Curandeira|Pastora|Juíza|Capitã|Soldada|Mercadora|Vendedora|Ferreira|Velha|Barqueira|Conselheira|Fundidora|Domadora|Sangradora|Armadureira|Cervejeira|Mineira|Princesa|Duquesa|Condessa|Baronesa|Lady|Pequena|Jovem Caçadora)$/.test(t0) || /^Jovem Caçadora/.test(d.name);
    const femR = /·\s*(élfica|humana|anã|nórdica)\b/.test(rl), mascR = /·\s*(élfico|humano|anão|nórdico)\b/.test(rl);
    const fem = d.sex ? d.sex === 'f' : femT || femR ? true : mascR ? false : FEM.test(first) || FEM.test(t0);
    /** anciãos, rainhas e senhores vestem o traje mais nobre (lvl03) */
    const elder = /^(Anciã|Ancião|Rainha|Rei|Senhora|Senhor|Grão)/.test(t0);
    /* 09/11 (Erling: "o sábio do templo é um mago, coloque a skin de um mago; já temos todas as skins"): quem tem ofício de classe veste o modelo dela */
    if (d.kind !== 'dwarf' && d.civil !== 'elf') { const who = d.name + ' ' + d.role;
      const cls = /Bruxa|Bruxo|Pactos|Cláusulas|Sangria/.test(who) ? 'bruxo' : /Conde|Mirela|Sommelier|Noctavar|Senhora do Sangue|Adega/.test(who) ? 'vampiro' : /Mãe-Alfa|Alfa da|Varg|Matilha|Ulfrik/.test(who) ? 'lobisomem'
        : /Paladin|Grão-Mestre|Bispa|Bispo|Abadia|Comendador|Honra Kármica|Templári|Aurora|Capela de Auréon/.test(who) ? 'paladino' : /Sábio|Mago|Maga|Arquimag|Copista|Alquimist|Pináculo|Incensos|Cronista|Vidente|Orvalho/.test(who) ? 'mago'
        : d.kind === 'technocrat' ? 'technocrata' : '';
      if (cls) return { fbx: `/models/personagens/${cls}_${fem ? 'm' : 'h'}.glb`, tex: '', hscale: ART_HUMAN * (d.kind === 'technocrat' ? 0.91 / 0.81 : 1) /* o boneco do tecnocrata é encolhido para 0,81; o modelo volta à altura de gente */, npc: true }; }
    if (d.kind === 'dwarf') { const elite = /^(Rei|Mestre|Guarda Real|Thane|Conselheira)/.test(d.name); return { fbx: `/models/personagens/anao_${fem ? 'm' : 'h'}_lvl0${elite ? 3 : 2}.glb`, tex: '', hscale: ART_DWARF, npc: true }; } /* lvl02 = vestido de couro; lvl03 = com armadura */
    if (d.civil === 'elf') return { fbx: `/models/personagens/elfo_${fem ? 'm' : 'h'}_lvl0${elder ? 3 : 2}.glb`, tex: '', hscale: ART_HUMAN, npc: true };
    if (d.civil === 'human' || (d.kind === 'nordic' && !/Guarda|Soldad|Capit|Patrulh|Vigia|Sentinela/.test(d.role))) return { fbx: `/models/personagens/humano_${fem ? 'm_lvl01' : 'h_lvl02'}.glb`, tex: '', hscale: ART_HUMAN, npc: true };
    /* 09/11: guardas e sentinelas (os do portão, os da plataforma) vestem o guerreiro de armadura; só as patrulhas de rota seguem no boneco */
    if (d.kind === 'nordic' && /Guarda|Sentinela|Soldad|Vigia|Porteiro/.test(d.role)) return { fbx: `/models/personagens/guerreiro_${fem ? 'm' : 'h'}_lvl03.glb`, tex: '', hscale: ART_HUMAN, npc: true };
    return null; };
  const SKIN_R = 48; /* 09/11: o mesmo alcance em que o NPC aparece (antes 30: entre 30 e 48 m ele aparecia blocado) */
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
  let gossipT = 12, gossipQ: { n: Npc; line: string; t: number } | null = null;
  function gossip(heroPos: THREE.Vector3) { const S = ctx.situ?.(); if (!S) return;
    const free = (n: Npc) => n.hero.root.visible && !n.def.route && !n.def.inside && !(n.barkT && n.barkT > 0) && !GUARD_RX.test(n.def.role);
    const pairs: [Npc, Npc][] = []; const vis = npcs.filter((n) => free(n) && (() => { const dd = Math.hypot(heroPos.x - n.pos.x, heroPos.z - n.pos.z); return dd > 4 && dd < 20; })());
    for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) if (Math.hypot(vis[i].pos.x - vis[j].pos.x, vis[i].pos.z - vis[j].pos.z) < 5.5) pairs.push([vis[i], vis[j]]);
    if (!pairs.length) return; const [a, b] = pairs[Math.floor(Math.random() * pairs.length)];
    const k = ctx.karma?.() ?? 0, recent = FAMA.deeds.filter((x) => performance.now() - x.at < 15 * 60e3);
    let pick: [string, string]; const dd = recent.length && Math.random() < 0.6 ? recent[recent.length - 1] : null;
    if (dd) { const L = dd.good ? GOSSIP_DEED.good : GOSSIP_DEED.bad; pick = L[Math.floor(Math.random() * L.length)]; pick = [pick[0].replace('{feito}', dd.txt), pick[1]]; }
    else { const L = GOSSIP[k >= 120 ? 'luz' : k <= -120 ? 'sombra' : 'neutro']; pick = L[Math.floor(Math.random() * L.length)]; }
    const fill = (s: string) => s.replace(/\{nome\}/g, S.nome);
    /* os dois se viram um para o outro */
    a.yaw = Math.atan2(b.pos.x - a.pos.x, b.pos.z - a.pos.z); b.yaw = Math.atan2(a.pos.x - b.pos.x, a.pos.z - b.pos.z); a.target = null; b.target = null; a.wait = Math.max(a.wait, 8); b.wait = Math.max(b.wait, 8);
    a.bark = fill(pick[0]); a.barkT = 4.2; gossipQ = { n: b, line: fill(pick[1]), t: 2.6 }; }
  let placed = false;
  /* flechas das sentinelas: uma haste fina que voa em arco do arqueiro até o bicho; o dano cai quando ela chega */
  const arrows: { m: THREE.Mesh; a: THREE.Vector3; e: GThreat; t: number; dur: number; dmg: number; from: THREE.Vector3 }[] = [];
  const arrowGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.8, 5).rotateX(Math.PI / 2), arrowMat = new THREE.MeshBasicMaterial({ color: 0xd8c8a0 }), aTmp = new THREE.Vector3(), aPrev = new THREE.Vector3();
  function shootArrow(from: THREE.Vector3, e: GThreat, dmg: number) { const m = new THREE.Mesh(arrowGeo, arrowMat); m.raycast = () => {}; const a = from.clone(); a.y += 1.5; m.position.copy(a); scene.add(m); arrows.push({ m, a, e, t: 0, dur: Math.max(0.25, a.distanceTo(e.pos) / 34), dmg, from: from.clone() }); }
  function tickArrows(dt: number) { for (let i = arrows.length - 1; i >= 0; i--) { const A = arrows[i]; A.t += dt; const k = Math.min(1, A.t / A.dur); aPrev.copy(A.m.position); aTmp.copy(A.e.pos); aTmp.y += 0.7; A.m.position.lerpVectors(A.a, aTmp, k); A.m.position.y += Math.sin(k * Math.PI) * 0.6; aTmp.copy(A.m.position).multiplyScalar(2).sub(aPrev); A.m.lookAt(aTmp);
      if (k >= 1) { scene.remove(A.m); arrows.splice(i, 1); if (A.e.alive) ctx.hitThreat?.(A.e, A.dmg, A.from); } } }
  function update(dt: number, t: number, heroPos: THREE.Vector3, night: number, gust: number) { tickArrows(dt);
    const r = ctx.canvas.getBoundingClientRect(); buildNear(heroPos);
    if (!placed) { placed = true; /* regra 19 (27/10): NPC nunca fica dentro de parede nem em cima de mobília — se o lugar marcado está ocupado, vai para o chão livre mais perto */
      for (const n of npcs) { const d = n.def; if (d.route || d.inside || d.fixed || ctx.walkable(n.pos.x, n.pos.z)) continue; let ok = false; for (let rr = 0.6; rr <= 6 && !ok; rr += 0.6) for (let k = 0; k < 12 && !ok; k++) { const a = k / 12 * 6.283 + rr, x = d.x + Math.cos(a) * rr, z = d.z + Math.sin(a) * rr; if (ctx.walkable(x, z)) { n.pos.set(x, 0, z); d.x = x; d.z = z; ok = true; } } } }
    /* fofoca: a resposta do segundo morador sai 2,6 s depois da pergunta do primeiro */
    if (gossipQ && (gossipQ.t -= dt) <= 0) { const q = gossipQ; gossipQ = null; if (q.n.hero.root.visible) { q.n.bark = q.line; q.n.barkT = 4.6; } }
    gossipT -= dt; if (gossipT <= 0 && !gossipQ) { gossipT = 22 + Math.random() * 20; gossip(heroPos); }
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
      if ((d as NpcDef & { onlyQ?: string }).onlyQ && !(d as NpcDef & { onlyQ?: string }).onlyQ!.split(',').some((id) => ctx.questOn?.(id))) { n.hero.root.visible = false; if (n.el.style.display !== 'none') n.el.style.display = 'none'; continue; }
      if (d.night && night < 0.45) { n.hero.root.visible = false; if (n.el.style.display !== 'none') n.el.style.display = 'none'; continue; } // a Corte só recebe à noite
      if (dH > 48 || !n.built) { n.hero.root.visible = false; if (n.el.style.display !== 'none') n.el.style.display = 'none'; continue; } // longe: nem anima nem desenha
      /* 09/11 (Erling: "os NPCs blocados aparecem e depois viram os bonitos, às vezes os dois juntos"): quem tem modelo de arte só aparece
         quando o modelo já está encaixado — o boneco procedural fica escondido como esqueleto e nunca é visto. Sem modelo (guardas, patrulhas), aparece direto. */
      skinNear(n, dH);
      if (n.skin === 1 && !n.skinTick) { n.hero.root.visible = false; if (n.el.style.display !== 'none') n.el.style.display = 'none'; continue; }
      if (!n.hero.root.visible) { n.hero.root.visible = true; n.pos.y = (d.inside ? 0 : ctx.heightAt(n.pos.x, n.pos.z)) + (d.yOff ?? 0); n.hero.root.position.copy(n.pos); }
      let mps = 0, head: number | null = null;
      /* 10/11 (Erling: "os NPCs precisam defender a cidade de monstros"): guarda, sentinela, vigia e soldado saem do posto quando um bicho chega
         perto (16 m dele, até 22 m do posto), correm até ele e lutam: o bicho passa a brigar com o guarda. Guarda não morre: se apanhar demais,
         cai de joelho por 6 s e levanta. Sem bicho, volta para o posto. */
      let fought = false;
      if (ctx.threats && !d.inside && !d.seat && !d.route && (GUARD_RX.test(d.role) || GUARD_RX.test(d.name))) {
        const g = n as Npc & { foeE?: GThreat | null; atkT?: number; ghp?: number; down?: number; gfoe?: GThreat['foe']; away?: boolean };
        if (!g.gfoe) g.gfoe = { pos: n.pos, alive: () => !(g.down && g.down > 0), hit: (dmg: number) => { g.ghp = (g.ghp ?? 140) - dmg; if (!n.hero.acting) n.hero.act('hit', true); if (g.ghp <= 0) { g.down = 6; g.ghp = 140; n.bark = 'Ugh… segurem a linha!'; n.barkT = 3; } } };
        if (g.down && g.down > 0) { g.down -= dt; fought = true; }
        else {
          let tgt = g.foeE && g.foeE.alive && g.foeE.active && Math.hypot(g.foeE.pos.x - d.x, g.foeE.pos.z - d.z) < 26 ? g.foeE : null;
          if (!tgt) { g.foeE = null; let bd = 16; for (const e of ctx.threats()) { if (!e.alive || !e.active || e.def.passive) continue; const dd = Math.hypot(e.pos.x - n.pos.x, e.pos.z - n.pos.z); if (dd < bd && Math.hypot(e.pos.x - d.x, e.pos.z - d.z) < 22) { bd = dd; tgt = e; } }
            if (tgt) { g.foeE = tgt; if (!tgt.foe || !tgt.foe.alive()) tgt.foe = g.gfoe; if (!(n.barkT && n.barkT > 0) && Math.random() < 0.6) { n.bark = GUARD_CRY[Math.floor(Math.random() * GUARD_CRY.length)]; n.barkT = 2.4; } } }
          /* 11/11 (Erling: "se o NPC está em cima do muro precisa usar flechas, e não flutuar nem ficar correndo feito bobo"): a sentinela da muralha
             NÃO sai do posto. Vira para o bicho e atira de arco (uma flecha a cada ~1,6 s, até 26 m). Antes ela corria atrás dele pelo ar, por dentro da paliçada */
          if (tgt && (d.yOff ?? 0) > 1) { fought = true; n.target = null; const dx = tgt.pos.x - n.pos.x, dz = tgt.pos.z - n.pos.z, l = Math.hypot(dx, dz) || 1; n.yaw = Math.atan2(dx, dz); head = n.yaw;
            if (l < 26) { g.atkT = (g.atkT ?? 0.6) - dt; if (g.atkT <= 0) { g.atkT = 1.4 + Math.random() * 0.5; n.hero.act('attack', true); shootArrow(n.pos, tgt, Math.max(3, Math.round(tgt.hpMax * 0.05))); } } }
          else if (tgt) { fought = true; g.away = true; n.target = null; const dx = tgt.pos.x - n.pos.x, dz = tgt.pos.z - n.pos.z, l = Math.hypot(dx, dz) || 1; n.yaw = Math.atan2(dx, dz); head = n.yaw;
            if (l > 1.5 + (tgt.def.radius ?? 0.5)) { const sp = 3.4 * dt; let moved = false; for (const turn of [0, 0.7, -0.7, 1.4, -1.4]) { const c = Math.cos(turn), sn = Math.sin(turn), ux = (dx * c - dz * sn) / l, uz = (dx * sn + dz * c) / l, nx = n.pos.x + ux * sp, nz = n.pos.z + uz * sp; if (walk(n, nx, nz)) { n.pos.x = nx; n.pos.z = nz; moved = true; break; } } if (moved) mps = 3.4; }
            else { g.atkT = (g.atkT ?? 0.3) - dt; if (g.atkT <= 0) { g.atkT = 1.0 + Math.random() * 0.5; n.hero.act('attack', true); ctx.hitThreat?.(tgt, Math.max(4, Math.round(tgt.hpMax * 0.07)), n.pos); } } }
          else { g.ghp = Math.min(140, (g.ghp ?? 140) + 6 * dt); if (g.away) { if (Math.hypot(n.pos.x - d.x, n.pos.z - d.z) > 1.5) n.target = new THREE.Vector2(d.x, d.z); else g.away = false; } }
        }
      }
      if (fought) { /* lutando (ou de joelho) */ }
      else if (d.seat) { /* 10/11 (Erling: "cheio de anões bebendo"): sentado no banco, de frente para a mesa; vira só a cabeça para o herói e de vez em quando bebe */
        n.yaw = d.seat.yaw; (n.hero as unknown as { sit?: number }).sit = d.seat.h; if (dH < 4.5) head = Math.atan2(heroPos.x - n.pos.x, heroPos.z - n.pos.z);
        n.wait -= dt; if (n.wait <= 0) { n.wait = 7 + Math.random() * 12; if (dH < 30 && !n.hero.acting) n.hero.act('drink', true); } }
      else if (d.route && dH >= 4.5) { // caravana: segue a estrada de um extremo ao outro
        const r0 = d.route; const tg = r0[n.ri]; const dx = tg.x - n.pos.x, dz = tg.z - n.pos.z, l = Math.hypot(dx, dz);
        if (l < 0.6) { n.ri += n.rdir; if (n.ri >= r0.length || n.ri < 0) { n.rdir *= -1; n.ri += n.rdir * 2; n.wait = 6; } }
        else if (n.wait > 0) n.wait -= dt; else if (inWag(n.pos.x + dx / l * 0.9, n.pos.z + dz / l * 0.9, 0.6) && !inWag(n.pos.x, n.pos.z, 0.6)) n.wait = 1.2; /* patrulha: carroça à frente, espera ela passar */ else { const pace = d.pace ?? 1.5, sp = pace * dt; n.pos.x += dx / l * sp; n.pos.z += dz / l * sp; mps = pace; n.yaw = Math.atan2(dx, dz); head = n.yaw; }
      } else if (dH < 4.5) { // olha para o herói
        n.target = null; const w = Math.atan2(heroPos.x - n.pos.x, heroPos.z - n.pos.z); let df = w - n.yaw; while (df > Math.PI) df -= 6.283; while (df < -Math.PI) df += 6.283; n.yaw += df * Math.min(1, dt * 5); head = n.yaw;
      } else if (n.target) {
        const dx = n.target.x - n.pos.x, dz = n.target.y - n.pos.z, l = Math.hypot(dx, dz);
        if (l < 0.3) { n.target = null; n.wait = 2 + Math.random() * 5; } else {
          const sp = 1.2 * dt, nx = n.pos.x + dx / l * sp, nz = n.pos.z + dz / l * sp;
          /* 11/11 (Erling: "Garrick fica bugado tentando atravessar a carroça e nunca para"): carroça no caminho = espera ao lado dela, parado, em vez de empurrar */
          if (inWag(nx, nz, 0.75) && !inWag(n.pos.x, n.pos.z, 0.75)) { n.target = null; n.wait = 2 + Math.random() * 3; }
          else if (walk(n, nx, nz)) { n.pos.x = nx; n.pos.z = nz; mps = 1.2; n.yaw = Math.atan2(dx, dz); head = n.yaw; } else n.target = null;
        }
      } else {
        n.wait -= dt;
        if (n.wait <= 0) { const a = Math.random() * 6.283, rr = Math.random() * d.radius; const tx = d.x + Math.cos(a) * rr, tz = d.z + Math.sin(a) * rr; if (walk(n, tx, tz) && !inWag(tx, tz, 1.2) && !inWag((tx + n.pos.x) / 2, (tz + n.pos.z) / 2, 0.9) && !npcs.some((o) => o !== n && o.hero.root.visible && Math.hypot(o.pos.x - tx, o.pos.z - tz) < 1.2)) n.target = new THREE.Vector2(tx, tz); else n.wait = 1; }
      }
      /* 09/11 (Erling: "a carroça atravessando ela"): carroça é corpo. Se uma passa por cima do NPC, ele dá um passo para o lado (para fora da caixa) */
      if (!d.inside && WAGON_BLOCK.length) for (const b of WAGON_BLOCK) { const dx = n.pos.x - b.x, dz = n.pos.z - b.z; if (dx * dx + dz * dz > 64) continue; const sn = Math.sin(b.yaw), cs = Math.cos(b.yaw), lx = dx * cs - dz * sn, lz = dx * sn + dz * cs - b.zc;
        if (Math.abs(lx) < b.hw + 0.5 && Math.abs(lz) < b.hl + 0.3) { const side = lx >= 0 ? 1 : -1, want = side * (b.hw + 0.6), step = Math.min(Math.abs(want - lx), dt * 2.2) * side; const nx = n.pos.x + step * cs, nz = n.pos.z - step * sn; if (walk(n, nx, nz)) { n.pos.x = nx; n.pos.z = nz; mps = Math.max(mps, 0.8); } break; } }
      n.pos.y = (d.inside ? 0 : ctx.heightAt(n.pos.x, n.pos.z)) + (d.yOff ?? 0);
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
