/* ---------- Instinto (Erling, 24/10: "os jogadores precisam encarnar o personagem, sentir o drama de ser lobisomem
   perto de um vampiro; ver um paladino negro tem que trazer raiva a um paladino puro").
   Depois da prova do mestre, cada caminho SENTE os outros pelo que eles são — antes de ver, antes de pensar:
   - Lobisomem fareja vampiro: a borda da tela pulsa em vermelho, o rastro de cheiro aparece no chão, o herói rosna.
   - Vampiro sente a luz (paladinos, caçadores, almas luminosas): o mundo perde a cor perto deles.
   - Paladino vê a corrupção: névoa escura aos pés de quem pende para a sombra; um PALADINO NEGRO arde em negro e ouro.
   - Caçador de demônios ouve pactos (bruxos, vampiros, diabretes); bruxo sente a fé; mago sente magia torta.
   - Guerreiro sente as feras grandes; tecnocrata MEDE: lê a assinatura (o caminho) de todo mundo.
   Vale para jogadores (rede) e para NPCs e bichos (quem joga sozinho também sente). Nada disso fere ninguém:
   dentro das vilas ninguém luta (regra 15), mas o instinto continua ligado — é drama, não combate. ---------- */
import * as THREE from 'three';
import { fine } from './dual3d';

export interface Being { key: string; name: string; pos: THREE.Vector3; path: string | null; lean: 'luz' | 'sombra' | null; remoteId?: number; lvl?: number }
export interface Mob { type: string; pos: THREE.Vector3; name: string }
type Sense = 'cheiro' | 'luz' | 'corrupcao' | 'pacto' | 'fe' | 'fera' | 'medida';
interface Rule { paths: string[]; lean?: 'luz' | 'sombra'; mobs: string[]; color: number; css: string; sense: Sense; r: number }
export const PATH_NAME: Record<string, string> = { gue: 'Guerreiro', pal: 'Paladino', cac: 'Caçador de Demônios', tec: 'Tecnocrata', vam: 'Vampiro', lob: 'Lobisomem', mag: 'Mago', bru: 'Bruxo' };
/* ---------- Instinto de classe (Erling, 24/10): uma passiva que LIGA E DESLIGA (tecla F, ou no menu de magias).
   Ligada: uma aura que só você vê no seu herói; você fica sensível ao redor — vê as auras de quem é seu inimigo natural, a borda da
   tela pulsa, e enxerga rastros, espíritos, dispositivos perdidos e tesouros escondidos que ninguém mais vê.
   Desligada: o corpo só acorda diante de AMEAÇA de verdade — alguém de nível muito acima chegando perto, ou muitos do mesmo
   tipo se aproximando — e nunca mais de uma vez por hora para cada tipo de ameaça (senão vira barulho e atrapalha o jogo). ---------- */
export const INSTINCT: Record<string, { name: string; desc: string; css: string; color: number }> = {
  humano: { name: 'Instinto de Sobrevivência', desc: 'O medo bom de quem quer voltar para casa: pegadas, cheiro de fumaça, o barulho errado na mata.', css: '#d8c8a0', color: 0xd8c8a0 },
  anao: { name: 'Sentido da Pedra', desc: 'A rocha conversa com quem nasceu dentro dela: veios, ecos, metal perdido debaixo da terra.', css: '#e0a060', color: 0xe0a060 },
  elfo: { name: 'Elo da Floresta', desc: 'As árvores lembram de tudo o que passou entre elas. Os espíritos da mata falam com quem escuta.', css: '#8ae0a0', color: 0x8ae0a0 },
  gue: { name: 'Faro de Batalha', desc: 'O sangue esquenta antes da luta. Você sente o inimigo e lê o rastro de quem fugiu.', css: '#ff8a5a', color: 0xff8a5a },
  pal: { name: 'Vigília da Fé', desc: 'A Luz mostra a sombra nas almas e o caminho de quem pede socorro.', css: '#ffe08a', color: 0xffe08a },
  cac: { name: 'Olho do Caçador', desc: 'Prata nos olhos: pactos, crias da noite e rastros de demônio aparecem para você.', css: '#d8dce4', color: 0xd8dce4 },
  tec: { name: 'Lógica do Mundo', desc: 'Calor, vibração, campo magnético. Onde os outros veem magia, você vê números — e acha o que foi perdido.', css: '#8af0ff', color: 0x8af0ff },
  vam: { name: 'Sede de Sangue', desc: 'Você ouve corações batendo e segue o cheiro do sangue por léguas.', css: '#ff4a5a', color: 0xff4a5a },
  lob: { name: 'Faro da Lua', desc: 'O nariz da matilha: sangue velho, cria do Conde, presa ferida.', css: '#d0b070', color: 0xd0b070 },
  mag: { name: 'Visão Arcana', desc: 'Os fios da magia brilham no ar: feitiços, pactos, portas escondidas.', css: '#9ab4ff', color: 0x9ab4ff },
  bru: { name: 'Sussurro do Pacto', desc: 'Toda alma tem preço, e você ouve o número.', css: '#c08aff', color: 0xc08aff },
};
export const instinctOf = (path: string | null, origin: string) => INSTINCT[path ?? ''] ?? INSTINCT[origin === 'dwarf' ? 'anao' : origin === 'elf' ? 'elfo' : 'humano'];
const RULES: Record<string, Rule> = {
  lob: { paths: ['vam'], mobs: ['bat', 'vampire'], color: 0xff2a2a, css: '#ff3a3a', sense: 'cheiro', r: 30 },
  vam: { paths: ['pal', 'cac'], lean: 'luz', mobs: ['templar'], color: 0xfff0c0, css: '#ffe9a8', sense: 'luz', r: 22 },
  pal: { paths: ['vam', 'bru', 'lob'], lean: 'sombra', mobs: ['zombie', 'skeleton', 'ghoul', 'imp', 'prince', 'bishop', 'cultist', 'darkpal', 'vampire'], color: 0x6a2aa0, css: '#c9a0ff', sense: 'corrupcao', r: 26 },
  cac: { paths: ['bru', 'vam'], mobs: ['imp', 'prince', 'bishop', 'cultist', 'vampire'], color: 0xff7a20, css: '#ffa060', sense: 'pacto', r: 26 },
  bru: { paths: ['pal', 'cac'], lean: 'luz', mobs: ['templar'], color: 0xfff0c0, css: '#ffe9a8', sense: 'fe', r: 22 },
  mag: { paths: ['bru'], mobs: ['fairy', 'imp', 'cultist'], color: 0x7ac8ff, css: '#9ad7ff', sense: 'pacto', r: 20 },
  gue: { paths: ['lob'], mobs: ['werewolf', 'treant', 'prince'], color: 0xff6a3a, css: '#ff8a5a', sense: 'fera', r: 20 },
  tec: { paths: [], mobs: [], color: 0x8af0ff, css: '#8af0ff', sense: 'medida', r: 30 },
};
/** o que o herói diz sozinho ao sentir (balão), por sentido */
const LINES: Record<Sense, string[]> = {
  cheiro: ['Esse cheiro… sangue velho e terra de cova. Vampiro.', 'Grrr… está perto. Eu sinto no pelo da nuca.', 'Sanguessuga. Na mesma praça que eu.'],
  luz: ['Essa luz… arde atrás dos olhos.', 'Um dos da Luz. Melhor manter distância.', 'O mundo fica sem cor perto dele.'],
  corrupcao: ['Há sombra nesta alma. Eu vejo.', 'Sorriso limpo, alma suja. A Luz não se engana.', 'Corrupção. Posso sentir o cheiro de enxofre daqui.'],
  pacto: ['Ouço o sussurro de um pacto. Alguém vendeu a alma por aqui.', 'Enxofre e promessa quebrada. Demônio por perto.', 'Isso não é magia limpa.'],
  fe: ['Fé. Pesa no ar como incenso velho.', 'Um crente. Os dentes dele estão cerrados de oração.'],
  fera: ['Algo grande. Bom. Faz tempo que não sinto o coração acelerar.', 'Uma fera digna. Odin está olhando.'],
  medida: ['Leitura anômala. Assinatura registrada.', 'Interessante. Os números não mentem, as pessoas sim.'],
};
const MOB_LINES: Partial<Record<Sense, string[]>> = { corrupcao: ['Mortos que andam. A Luz não aceita isso.', 'Ossos de pé… alguém profanou uma cova.'], pacto: ['Enxofre. Um demônio, e não está sozinho.'] };
/** ameaça de verdade (com o instinto desligado): só isto acorda o corpo */
const THREAT = { forte: ['Um arrepio sobe pela espinha. Tem alguém aqui muito, MUITO mais forte do que eu.', 'Meu corpo inteiro diz: não brigue com esse.'], bando: ['São muitos. E vêm juntos.', 'Conto um, dois, três… isso não é coincidência. É um bando.'] };
const FALLEN = ['Um paladino com a alma podre… Você envergonha a Ordem.', 'Paladino negro. A Luz devia ter queimado você.', 'Você jurou a mesma luz que eu. E cuspiu nela.'];

function radialTex(c: string) { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d')!, gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }
const HOUR = 3600 * 1000;

export function createInstinct(o: { scene: THREE.Scene; canvas: HTMLCanvasElement; bubble(t: string): void; log(t: string, c?: string): void; tint?(remoteId: number, color: string | null, extra?: string): void }) {
  const vig = document.createElement('div'); vig.id = 'instinto'; document.body.appendChild(vig);
  const auraTex = { dark: radialTex('rgba(40,0,60,.9)'), fallen: radialTex('rgba(255,200,80,.9)'), red: radialTex('rgba(255,40,40,.85)'), warm: radialTex('rgba(255,240,190,.85)'), cyan: radialTex('rgba(120,240,255,.8)'), orange: radialTex('rgba(255,140,40,.85)'), purple: radialTex('rgba(170,70,255,.8)') };
  const auras = new Map<string, { s: THREE.Sprite; s2?: THREE.Sprite; kind: string }>();
  const seen = new Map<string, number>(); let lastLine = -999; const lastTint = new Map<number, string>();
  let cd: Record<string, number> = {}; try { cd = JSON.parse(localStorage.getItem('karmika.inst.cd') || '{}'); } catch { /* */ }
  const saveCd = () => { try { localStorage.setItem('karmika.inst.cd', JSON.stringify(cd)); } catch { /* */ } };
  /** o "alerta" do instinto desligado: dura alguns segundos e marca quem disparou */
  let alarm: { until: number; keys: Set<string>; css: string; k: number } | null = null;
  function aura(key: string, kind: keyof typeof auraTex | null, pos: THREE.Vector3, t: number) {
    let a = auras.get(key);
    if (!kind) { if (a) { o.scene.remove(a.s); if (a.s2) o.scene.remove(a.s2); auras.delete(key); } return; }
    if (!a || a.kind !== kind) { if (a) { o.scene.remove(a.s); if (a.s2) o.scene.remove(a.s2); }
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: auraTex[kind], transparent: true, depthWrite: false, blending: kind === 'dark' ? THREE.NormalBlending : THREE.AdditiveBlending, fog: false })); o.scene.add(fine(s));
      let s2: THREE.Sprite | undefined; if (kind === 'fallen') { s2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: auraTex.dark, transparent: true, depthWrite: false, fog: false })); o.scene.add(fine(s2)); } // paladino negro: ouro por fora, breu por dentro
      else if (kind === 'dark') { s2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: auraTex.purple, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); o.scene.add(fine(s2)); } // breu por dentro, brilho roxo doente em volta: lê em chão claro E escuro
      a = { s, s2, kind }; auras.set(key, a); }
    const p = 0.5 + 0.5 * Math.sin(t * 2.6 + key.length);
    a.s.position.set(pos.x, pos.y + (kind === 'warm' || kind === 'fallen' ? 1.1 : 0.35), pos.z); a.s.scale.setScalar((kind === 'fallen' ? 3.4 : kind === 'warm' ? 2.6 : 2.2) * (0.9 + p * 0.2)); a.s.material.opacity = kind === 'dark' ? 0.55 + p * 0.25 : 0.35 + p * 0.3;
    if (a.s2) { if (kind === 'dark') { a.s2.position.set(pos.x, pos.y + 0.9, pos.z); a.s2.scale.setScalar(2.9 * (0.92 + p * 0.16)); a.s2.material.opacity = 0.28 + p * 0.22; } else { a.s2.position.set(pos.x, pos.y + 1.0, pos.z); a.s2.scale.setScalar(2.2); a.s2.material.opacity = 0.7; } }
  }
  let acc = 0;
  function say(key: string, line: string, css: string, t: number, gap: number) { if (t - lastLine < gap) return; lastLine = t; seen.set(key, t); o.bubble(line); o.log(`✧ Instinto: ${line}`, css); }
  function update(dt: number, t: number, me: { pos: THREE.Vector3; path: string | null; lean: 'luz' | 'sombra' | null; inside: boolean; on: boolean; lvl: number }, beings: Being[], mobs: Mob[]) {
    acc += dt; if (acc < 0.15) return; acc = 0;
    const R = me.path ? RULES[me.path] : null, now = Date.now();
    const live = new Set<string>(); let best: { k: number; css: string; sense: Sense; key: string; fallen?: boolean } | null = null;
    if (!me.inside) {
      /* 1) ameaça de verdade: vale com o instinto ligado ou desligado (desligado: no máximo 1× por hora por tipo) */
      const strong = beings.filter((b) => b.remoteId !== undefined && (b.lvl ?? 0) >= me.lvl + 15 && b.pos.distanceTo(me.pos) < 28);
      const groups = new Map<string, Being[]>(); for (const b of beings) if (b.remoteId !== undefined && b.path && b.pos.distanceTo(me.pos) < 34) { const g = groups.get(b.path) ?? []; g.push(b); groups.set(b.path, g); }
      const mobGroups = new Map<string, Mob[]>(); for (const m of mobs) if (m.pos.distanceTo(me.pos) < 30) { const g = mobGroups.get(m.type) ?? []; g.push(m); mobGroups.set(m.type, g); }
      const fire = (kind: string, keys: string[], line: string, css: string) => { if (!me.on && now - (cd[kind] ?? 0) < HOUR) return; if (me.on && now - (cd[kind] ?? 0) < 10 * 60 * 1000) return; cd[kind] = now; saveCd(); alarm = { until: t + 7, keys: new Set(keys), css, k: 0.85 }; say('alarm:' + kind, line, css, t, 0); };
      if (strong.length) fire('forte', strong.map((b) => b.key), THREAT.forte[Math.floor(Math.random() * 2)], '#ff9a6a');
      for (const [p, g] of groups) if (g.length >= 3) fire('bando:' + p, g.map((b) => b.key), `${THREAT.bando[Math.floor(Math.random() * 2)]} (${g.length}× ${PATH_NAME[p] ?? p})`, '#ff9a6a');
      if (R) for (const [ty, g] of mobGroups) if (g.length >= 4 && R.mobs.includes(ty)) fire('horda:' + ty, [], THREAT.bando[1], R.css);
      /* 2) com o instinto LIGADO: as auras dos seus inimigos naturais, a borda, as falas (com calma) */
      if (R && me.on) {
        for (const b of beings) { const d = b.pos.distanceTo(me.pos); if (d > 45) continue;
          const enemyByPath = !!b.path && R.paths.includes(b.path), enemyByLean = !!R.lean && b.lean === R.lean, fallen = me.path === 'pal' && b.path === 'pal' && b.lean === 'sombra' && me.lean !== 'sombra';
          let kind: keyof typeof auraTex | null = null;
          if (fallen) kind = 'fallen'; else if (me.path === 'pal' && b.lean === 'sombra') kind = 'dark'; else if ((me.path === 'vam' || me.path === 'bru') && (b.lean === 'luz' || b.path === 'pal')) kind = 'warm'; else if (me.path === 'lob' && b.path === 'vam') kind = 'red'; else if (me.path === 'cac' && (b.path === 'bru' || b.path === 'vam')) kind = 'orange';
          if (kind) { aura(b.key, kind, b.pos, t); live.add(b.key); }
          if (b.remoteId !== undefined && o.tint) { const col = fallen ? '#ffcc55' : enemyByPath ? R.css : null, extra = me.path === 'tec' ? `assinatura: ${b.path ? PATH_NAME[b.path] ?? b.path : 'humano comum'}${b.lean ? (b.lean === 'luz' ? ' ☀' : ' ☾') : ''} · Nv ${b.lvl ?? '?'}` : undefined, kk = `${col}|${extra}`;
            if (lastTint.get(b.remoteId) !== kk) { lastTint.set(b.remoteId, kk); o.tint(b.remoteId, col, extra); } }
          if ((enemyByPath || enemyByLean || fallen) && d < R.r) { const k = (1 - d / R.r) * (enemyByPath || fallen ? 1 : 0.6); if (!best || k > best.k) best = { k, css: fallen ? '#ffcc55' : R.css, sense: R.sense, key: b.key, fallen }; } }
        for (const m of mobs) { if (!R.mobs.includes(m.type)) continue; const d = m.pos.distanceTo(me.pos); if (d > R.r) continue; const k = (1 - d / R.r) * 0.7; if (!best || k > best.k) best = { k, css: R.css, sense: R.sense, key: 'mob:' + m.type }; }
      } else if (!me.on) for (const [id] of lastTint) { o.tint?.(id, null); lastTint.delete(id); }
      // quem disparou o alarme fica marcado enquanto ele dura (mesmo desligado)
      if (alarm && t < alarm.until) for (const b of beings) if (alarm.keys.has(b.key)) { aura(b.key, 'orange', b.pos, t); live.add(b.key); }
    }
    for (const [k] of auras) if (!live.has(k)) aura(k, null, me.pos, t);
    const al = alarm && t < alarm.until ? alarm : null; if (alarm && !al) alarm = null;
    if (al) { vig.style.setProperty('--ic', al.css); vig.style.opacity = String(al.k * (0.6 + 0.4 * Math.abs(Math.sin(t * 5)))); vig.classList.add('on'); }
    else if (best) { vig.style.setProperty('--ic', best.css); vig.style.opacity = String(Math.min(0.7, 0.18 + best.k * 0.55)); vig.classList.add('on'); }
    else { vig.style.opacity = '0'; vig.classList.remove('on'); }
    o.canvas.style.filter = me.on && best && (best.sense === 'luz' || best.sense === 'fe') ? `saturate(${(1 - best.k * 0.6).toFixed(2)})` : '';
    // a fala sozinha (ligado): uma vez por alvo a cada 10 minutos, nunca mais que uma a cada 3 minutos
    if (me.on && best && best.k > 0.3 && t - (seen.get(best.key) ?? -1e9) > 600) { const pool = best.fallen ? FALLEN : (best.key.startsWith('mob:') && MOB_LINES[best.sense]) || LINES[best.sense]; say(best.key, pool[Math.floor(Math.random() * pool.length)], best.css, t, 180); }
  }
  function clear() { for (const [k] of auras) aura(k, null, new THREE.Vector3(), 0); vig.style.opacity = '0'; o.canvas.style.filter = ''; }
  return { update, clear };
}

/* ---------- o herói fala sozinho: lugares e momentos, na voz do caminho e da inclinação ---------- */
export type Place = 'igreja' | 'cemiterio' | 'noite' | 'masmorra' | 'cidade';
const SELF: Record<Place, Record<string, string[]>> = {
  igreja: { pal: ['A Luz mora aqui. Eu também, por um instante.'], vam: ['Pedra consagrada… queima a sola dos pés.'], bru: ['Tantas velas para um deus que não responde.'], tec: ['Belo órgão. Mal calibrado.'], sombra: ['Os santos dos vitrais estão olhando para mim.'], luz: ['Faz bem entrar num lugar assim.'], '*': ['Silêncio de igreja. Até o passo ecoa.'] },
  cemiterio: { pal: ['Esta terra não está em paz.'], lob: ['Cheiro de osso. E de algo que mexe nele.'], vam: ['Primos distantes dormem aqui.'], cac: ['Cemitério sem sal nas covas. Alguém foi preguiçoso.'], '*': ['Os mortos daqui não dormem direito.', 'Frio diferente. Frio de gente.'] },
  noite: { vam: ['A noite. Enfim, o mundo do meu tamanho.'], lob: ['A lua puxa. Sempre puxa.'], pal: ['A noite é quando a Luz mais faz falta.'], sombra: ['A noite me cai bem.'], '*': ['Escureceu. Melhor ficar de olhos abertos.'] },
  masmorra: { gue: ['Pedra, escuro e inimigos. Odin gosta de lugares assim.'], tec: ['Umidade alta, ar parado. Anotado.'], '*': ['Daqui para baixo, só o que eu levo comigo.'] },
  cidade: { lob: ['Gente demais. Cheiro demais.'], vam: ['Tantos corações batendo…'], '*': ['Cidade grande. Olhos grandes.'] },
};
export function selfLine(place: Place, path: string | null, lean: 'luz' | 'sombra' | null): string | null {
  const P = SELF[place]; const pool = (path && P[path]) || (lean && P[lean]) || P['*']; if (!pool) return null; return pool[Math.floor(Math.random() * pool.length)];
}
