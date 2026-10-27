/** Companheiros: pet que coleta itens e montaria. Modelos quadrúpedes reaproveitados dos inimigos. */
import * as THREE from 'three';
import { buildQuad, animQuadWalk, buildFairy } from './enemies';
import { buildDog, buildSpider, buildScorpion, buildSnake, buildSkull, buildAutomaton, type BRig } from './bestas3d';
import { buildWolf, buildHorse, buildBoar, buildCat } from './werewolf3d';
import { mergeStatic } from './merge3d';
import { fine } from './dual3d';
import { ramp } from './toon3d';

export type PetSkill = 'alarido' | 'mordida' | 'faro' | 'fucar';
export interface PetKind { id: string; name: string; quad: 'fox' | 'wolf' | 'rat' | 'horse' | 'boar' | 'cat' | 'dog' | 'bestia'; tint?: number; scale: number; speed: number; silent?: boolean;
  /** gata malhada: cor das manchas; cachorro: cor da mancha do olho */ patch?: number; /** corpo da bestiário (pets de masmorra e de região): spider | scorpion | snake | skull | automaton | fairy */ make?: string; /** cor 2 */ tint2?: number; /** flutua (caveira, fada) */ float?: number;
  /** o que ele faz sozinho (além de buscar o que cai), o que come e onde se arruma um */ skill?: PetSkill; eats?: 'carne' | 'graos' | 'tudo'; where?: string; blurb?: string }
export const PETS: Record<string, PetKind> = {
  pet_fox: { id: 'pet_fox', name: 'Raposa Ruiva', quad: 'fox', scale: 0.9, speed: 6.5, skill: 'alarido', eats: 'carne', where: 'Corwin, o Domador', blurb: 'Esperta e barulhenta. No combate, grita e distrai quem vem para cima de você.' },
  pet_pup: { id: 'pet_pup', name: 'Filhote de Lobo', quad: 'wolf', tint: 0x8a8a8a, scale: 0.55, speed: 6.0, skill: 'mordida', eats: 'carne', where: 'Corwin, o Domador', blurb: 'Fiel. Quando você briga, ele morde as canelas de quem te ataca.' },
  pet_cat: { id: 'pet_cat', name: 'Gatinho Malhado', quad: 'cat', scale: 1.0, speed: 6.2, skill: 'alarido', eats: 'carne', where: 'Corwin, o Domador', blurb: 'Macio, curioso e dono da casa. No combate, chia e arranha a cara de quem vem: o inimigo para por 1,5 s.' },
  pet_cat_b: { id: 'pet_cat_b', name: 'Gata Preta', quad: 'cat', tint: 0x26222a, scale: 1.0, speed: 6.4, skill: 'faro', eats: 'carne', where: 'Corwin, o Domador', blurb: 'Olhos verdes no escuro. Acha o que caiu longe (22 m) e, na briga, um chiado distrai por 1 s.' },
  pet_rat: { id: 'pet_rat', name: 'Ratinho de Porão', quad: 'rat', scale: 0.55, speed: 5.5, skill: 'faro', eats: 'graos', where: 'Corwin, o Domador', blurb: 'Faro fino: acha o que caiu bem mais longe que os outros.' },
  pet_piglet: { id: 'pet_piglet', name: 'Leitão Malhado', quad: 'boar', tint: 0xd8a890, scale: 0.42, speed: 5.0, skill: 'fucar', eats: 'tudo', where: 'Corwin, o Domador', blurb: 'Fuça a terra quando você descansa e de vez em quando traz uma coisinha.' },
  /* 26/10 (Erling: "um boxer todo branco com uma manchinha no olho, e uma gatinha cinza-escura com manchas brancas") */
  pet_boxer: { id: 'pet_boxer', name: 'Boxer Branco', quad: 'dog', tint: 0xf4f0ea, patch: 0x241c1a, scale: 1.0, speed: 6.4, skill: 'mordida', eats: 'carne', where: 'Corwin, o Domador', blurb: 'Todo branco, com uma mancha preta em volta do olho. Abana o rabinho o tempo todo e, na briga, agarra a canela de quem vem.' },
  pet_cat_grey: { id: 'pet_cat_grey', name: 'Gatinha Cinzenta', quad: 'cat', tint: 0x3e3e46, patch: 0xf2eee8, scale: 0.95, speed: 6.2, skill: 'faro', eats: 'carne', where: 'Corwin, o Domador', blurb: 'Cinza-escura com manchas brancas e meias brancas. Acha o que caiu longe e dorme em cima da mochila.' },
  /* de cada região (os domadores de lá vendem) */
  pet_raposa_prata: { id: 'pet_raposa_prata', name: 'Raposa Prateada', quad: 'fox', tint: 0xb8c0c8, scale: 0.9, speed: 6.6, skill: 'faro', eats: 'carne', where: 'Lithendel', blurb: 'Raposa das matas élficas. Some e reaparece com algo na boca.' },
  pet_javali_cinza: { id: 'pet_javali_cinza', name: 'Leitão das Cinzas', quad: 'boar', tint: 0x4a4440, scale: 0.42, speed: 5.0, skill: 'fucar', eats: 'tudo', where: 'Brasaforja', blurb: 'Nasceu perto da forja: não tem medo de fagulha nem de anão bravo.' },
  pet_lobo_neve: { id: 'pet_lobo_neve', name: 'Filhote de Lobo da Neve', quad: 'wolf', tint: 0xe8eef4, scale: 0.55, speed: 6.2, skill: 'mordida', eats: 'carne', where: 'Jarlsheim', blurb: 'Branco como o Fiorde. Uiva junto quando você grita.' },
  pet_pantera: { id: 'pet_pantera', name: 'Filhote de Pantera', quad: 'cat', tint: 0x14121a, scale: 1.6, speed: 6.8, skill: 'mordida', eats: 'carne', where: 'Uivo Antigo', blurb: 'Da Selva Licantropa. Ainda pequena, mas já caça sozinha.' },
  pet_aranha_latao: { id: 'pet_aranha_latao', name: 'Aranha de Latão', quad: 'bestia', make: 'spider', tint: 0xb08a40, tint2: 0x6a4a2a, scale: 0.32, speed: 6.0, skill: 'faro', eats: 'graos', where: 'Porto Caldeira', blurb: 'Brinquedo de corda dos engenheiros. Precisa de óleo (grãos servem) e acha parafuso perdido a 20 metros.' },
  pet_fada: { id: 'pet_fada', name: 'Fadinha de Lumenhal', quad: 'bestia', make: 'fairy', scale: 0.8, speed: 6.6, float: 1.1, skill: 'alarido', eats: 'graos', where: 'Lumenhal', blurb: 'Uma fada que resolveu ficar. Grita no ouvido de quem te ataca.' },
  /* de masmorra: a versão filhote do chefe */
  pet_aranha_mae: { id: 'pet_aranha_mae', name: 'Filhote da Aracnídea', quad: 'bestia', make: 'spider', tint: 0x1a1214, tint2: 0x2a1418, scale: 0.36, speed: 6.0, skill: 'mordida', eats: 'carne', where: 'Ninho da Aracnídea-Mãe (chefe)', blurb: 'Saiu de uma bolsa de ovos atrasada. Tem a ampulheta da mãe nas costas.' },
  pet_escorpiao: { id: 'pet_escorpiao', name: 'Escorpiãozinho Real', quad: 'bestia', make: 'scorpion', tint: 0x2a1a14, tint2: 0x6a2a14, scale: 0.4, speed: 5.8, skill: 'mordida', eats: 'carne', where: 'Covil do Escorpião-Rei (chefe)', blurb: 'Herdeiro do Rei das Dunas. Ferroa quem chega perto de você.' },
  pet_cobrinha: { id: 'pet_cobrinha', name: 'Cobrinha do Lodo', quad: 'bestia', make: 'snake', tint: 0x3a5a2a, tint2: 0xb8a860, scale: 0.6, speed: 5.6, skill: 'faro', eats: 'carne', where: 'Poço dos Afogados (chefe)', blurb: 'Vivia no cabelo do Afogador Antigo. Agora vive no seu ombro.' },
  pet_automato: { id: 'pet_automato', name: 'Autômato de Bolso', quad: 'bestia', make: 'automaton', tint: 0xb08a40, tint2: 0x6a4a2a, scale: 0.32, speed: 5.6, skill: 'fucar', eats: 'graos', where: 'Fábrica Afogada de Ferrugem (chefe)', blurb: 'Uma peça do Colosso que resolveu andar sozinha. Desmonta coisas e traz o que acha.' },
  pet_lobo_hrim: { id: 'pet_lobo_hrim', name: 'Lobinho de Hrímnir', quad: 'wolf', tint: 0xbfe4ff, scale: 0.6, speed: 6.4, skill: 'alarido', eats: 'carne', where: 'Salão de Hrímnir (chefe)', blurb: 'Deitava aos pés do Jotun. O hálito dele embaça no verão.' },
  pet_caozinho_inferno: { id: 'pet_caozinho_inferno', name: 'Cãozinho do Inferno', quad: 'wolf', tint: 0x2a0e08, scale: 0.55, speed: 6.6, skill: 'mordida', eats: 'carne', where: 'Despensa da Fome Sem Fim (chefe)', blurb: 'Come sobras e fagulhas. Os olhos brilham no escuro.' },
  pet_caveirinha: { id: 'pet_caveirinha', name: 'Caveirinha de Orrukh', quad: 'bestia', make: 'skull', tint: 0x9a6aff, scale: 0.55, speed: 6.4, float: 1.0, skill: 'faro', eats: 'tudo', where: 'Túneis de Orrukh (guardião de um nível)', blurb: 'Bate os dentes quando há ouro por perto. Ninguém sabe de quem ela era.' },
};
export interface MountKind { id: string; name: string; tint?: number; scale: number; speed: number; where?: string; blurb?: string;
  /** corpo: cavalo (com variantes) ou fera de montaria */ body?: 'horse' | 'wolf' | 'boar' | 'cat'; /** variantes do cavalo */ horse?: { mane?: number; socks?: boolean; horn?: number; antlers?: number; barding?: number; fire?: number; shaggy?: boolean }; /** nível para montar */ lvl?: number; /** cor da manta */ cloth?: number }
export const MOUNTS: Record<string, MountKind> = {
  mount_horse: { id: 'mount_horse', name: 'Cavalo Baio', scale: 1.0, speed: 1.75, where: 'Orm, o Estalajadeiro', blurb: 'Manso e firme na estrada.' },
  mount_grey: { id: 'mount_grey', name: 'Cavalo Ruço', tint: 0x9a968e, scale: 1.0, speed: 1.8, where: 'Orm, o Estalajadeiro', blurb: 'Pelagem cinza das montanhas; não estranha frio.' },
  mount_black: { id: 'mount_black', name: 'Corcel Negro', tint: 0x1a1612, scale: 1.05, speed: 1.9, where: 'Orm, o Estalajadeiro', blurb: 'Rápido e nervoso. Quem monta precisa merecer.', lvl: 8 },
  /* 26/10 (Erling: "mais montarias legais dependendo da cidade e do nível do lugar"): cada estábulo tem as suas */
  mount_pony: { id: 'mount_pony', name: 'Pônei das Cinzas', tint: 0x6a4a34, scale: 0.82, speed: 1.65, where: 'Brasaforja', horse: { mane: 0x1a1210, socks: true, shaggy: true }, cloth: 0x8a3a1a, blurb: 'Baixinho, peludo e teimoso como um anão. Sobe qualquer ladeira.' },
  mount_warboar: { id: 'mount_warboar', name: 'Javali de Guerra Anão', body: 'boar', tint: 0x4a3a2c, scale: 1, speed: 1.85, where: 'Brasaforja', lvl: 12, cloth: 0x8a3a1a, blurb: 'Presas com anel de bronze. Atravessa cerca em vez de pular.' },
  mount_whitestag: { id: 'mount_whitestag', name: 'Cervo Branco de Lithendel', tint: 0xf0ece4, scale: 0.95, speed: 1.85, where: 'Lithendel', lvl: 5, horse: { mane: 0xd8d0c0, antlers: 0xe8dcc0 }, cloth: 0x3a6a4a, blurb: 'Os elfos não domam, pedem. Ele aceita levar você, por enquanto.' },
  mount_palfrey: { id: 'mount_palfrey', name: 'Palafrém Real', tint: 0xeee6da, scale: 1.0, speed: 1.9, where: 'Askavik', lvl: 12, horse: { mane: 0xd8b860, socks: false }, cloth: 0x2a3a7a, blurb: 'Da estrebaria do castelo. Passo macio, crina de ouro.' },
  mount_templar: { id: 'mount_templar', name: 'Corcel de Guerra Templário', tint: 0x8a8278, scale: 1.08, speed: 2.0, where: 'Askavik', lvl: 18, horse: { mane: 0x2a2420, barding: 0xc8ccd4 }, cloth: 0xe8dcb0, blurb: 'Bardas de aço e o sol de Auréon na testa. Não recua.' },
  mount_brass: { id: 'mount_brass', name: 'Cavalo de Latão', tint: 0xb08a40, scale: 1.05, speed: 2.05, where: 'Porto Caldeira', lvl: 25, horse: { mane: 0x5a4a3a, barding: 0x8a6a3a }, cloth: 0x5a1e14, blurb: 'Feito na Companhia. Não come, não cansa, mas pede óleo e chia na subida.' },
  mount_elk: { id: 'mount_elk', name: 'Alce do Norte', tint: 0x5a3e28, scale: 1.12, speed: 2.0, where: 'Jarlsheim', lvl: 30, horse: { mane: 0x2a1e14, antlers: 0xc8b898, shaggy: true }, cloth: 0x3a4a6a, blurb: 'Galhada de rei e pernas de neve funda. Os vikings juram que entende runas.' },
  mount_snowwolf: { id: 'mount_snowwolf', name: 'Lobo das Neves', body: 'wolf', tint: 0xe8eef4, scale: 1, speed: 2.1, where: 'Jarlsheim', lvl: 35, cloth: 0x3a4a6a, blurb: 'Um lobo grande o bastante para uma sela. Morde quem chega perto de você.' },
  mount_unicorn: { id: 'mount_unicorn', name: 'Unicórnio do Pináculo', tint: 0xf8f6ff, scale: 1.02, speed: 2.15, where: 'Lumenhal', lvl: 42, horse: { mane: 0xd8c8ff, horn: 0xffe8a0 }, cloth: 0x6a4aaa, blurb: 'O chifre brilha quando há magia perto. Só deixa montar quem nunca maltratou um bicho.' },
  mount_nightmare: { id: 'mount_nightmare', name: 'Pesadelo do Conde', tint: 0x120e10, scale: 1.08, speed: 2.25, where: 'Corvoscuro', lvl: 52, horse: { mane: 0x2a0a08, fire: 0xff4a1a }, cloth: 0x4a0a14, blurb: 'Olhos de brasa e crina que queima sem consumir. Os cavalos normais fogem dele.' },
  mount_moonwolf: { id: 'mount_moonwolf', name: 'Lobo da Lua', body: 'wolf', tint: 0x6a6a78, scale: 1.08, speed: 2.25, where: 'Uivo Antigo', lvl: 50, cloth: 0x2a2a3a, blurb: 'Da matilha da Lua Velha. Corre mais quando é noite.' },
  mount_sabre: { id: 'mount_sabre', name: 'Tigre-Dentes-de-Sabre', body: 'cat', tint: 0xc8782a, scale: 1, speed: 2.3, where: 'Uivo Antigo', lvl: 55, cloth: 0x3a1a0a, blurb: 'O maior gato da Selva Licantropa. Ronrona como um trovão.' },
};
/** o bicho em si (sem nome flutuando): o mesmo modelo no mundo e na página do Estábulo */
export function petModel(kind: PetKind) {
  // 25/10: a raposa e o filhote são o canídeo esguio (werewolf3d); o rato segue o quadrúpede de antes (Erling gostou), o leitão é o javali pequeno
  if (kind.quad === 'bestia' || kind.quad === 'dog') return bestiaPet(kind);
  const W = kind.quad === 'cat' ? buildCat(kind.tint ? { coat: kind.tint, belly: kind.patch ?? 0x3a3440, eye: kind.patch ? 0x9ad84a : 0x7aff6a, stripes: false, patches: kind.patch } : {}) : kind.quad === 'wolf' ? buildWolf({ fur: kind.tint ?? 0x8a847c }) : kind.quad === 'fox' ? buildWolf({ fur: 0xc8641e, belly: 0xf4ece0, eye: 0xffb030 }) : kind.quad === 'horse' ? buildHorse({ coat: kind.tint ?? 0x6a5a4a }) : kind.quad === 'boar' ? buildBoar({ fur: kind.tint }) : null; const q = W ? null : buildQuad(kind.quad as 'rat', kind.tint);
  const root = new THREE.Group(); root.scale.setScalar(kind.scale * (kind.quad === 'wolf' ? 1.15 : kind.quad === 'fox' ? 0.62 : kind.quad === 'cat' ? 1.3 : kind.quad === 'horse' ? 0.85 : 1)); root.add(W ? W.root : q!.root); mergeStatic(W ? W.root : q!.root, ramp);
  let ph = 0;
  const pose = (dt: number, mv: number, t: number) => { ph += dt * (6 + mv * 2.2) * (mv > 0.1 ? 1 : 0); if (W) (W.pose as (p: { dt: number; mv: number; wind: number; strike: number; hurt: number; idle: boolean }) => void)({ dt, mv, wind: 0, strike: 0, hurt: 0, idle: mv < 0.1 }); else animQuadWalk(q!, ph, mv, t, 7); };
  return { root, pose };
}
/** pets da bestiário (cachorro, aranha, escorpião, cobra, caveira, autômato, fada): o mesmo corpo dos monstros, em miniatura */
function bestiaPet(kind: PetKind) {
  const root = new THREE.Group(); root.scale.setScalar(kind.scale);
  if (kind.quad === 'dog') { const d = buildDog({ coat: kind.tint ?? 0xd8c8b0, patch: kind.patch, patchEye: 1 }); root.add(d.root); return { root, pose: (dt: number, mv: number) => d.pose({ dt, mv, idle: mv < 0.1 }) }; }
  const c1 = kind.tint ?? 0x6a5a4a, c2 = kind.tint2 ?? c1;
  const R: BRig = kind.make === 'spider' ? buildSpider({ col: c1, col2: c2, abd: kind.id === 'pet_aranha_mae' ? 1.6 : 1, mark: kind.id === 'pet_aranha_mae' ? 0xff1a2a : undefined, eye: kind.id === 'pet_aranha_latao' ? 0x6ad0ff : 0xff3a1a })
    : kind.make === 'scorpion' ? buildScorpion(c1, c2, 0xff6a2a) : kind.make === 'snake' ? buildSnake(c1, c2, 12, 0.1) : kind.make === 'skull' ? buildSkull(c1, 0xe8d8ff) : kind.make === 'automaton' ? buildAutomaton(c1, c2) : (buildFairy() as unknown as BRig);
  const body = new THREE.Group(); body.position.y = kind.float ?? 0; body.add(R.root); root.add(body);
  const fake = { state: 'idle', t: 0, id: 7 };
  return { root, pose: (dt: number, mv: number) => { fake.t += dt; fake.state = mv > 0.1 ? 'chase' : 'idle'; R.update(fake, dt, 0, 0, 0, mv); if (kind.float) body.position.y = kind.float + Math.sin(fake.t * 2.2) * 0.08; } };
}
/** a montaria com sela, manta, estribos e rédea */
/* TAMANHO DE VERDADE (26/10, Erling: "um cavalo é bem maior que um humano"): a cernelha de um cavalo fica na altura do ombro de um homem
   (~1,6 m); a do pônei, no peito. As feras de montaria (lobo, javali, tigre) são do mesmo porte. */
export const MOUNT_K = 1.22;
type MountRig = { pose(p: { dt: number; mv: number; idle?: boolean }): void; seat: number; body: THREE.Object3D; neck?: THREE.Object3D };
export function mountModel(kind: MountKind) {
  const root = new THREE.Group(); root.scale.setScalar(kind.scale * MOUNT_K);
  const tm = (c: number) => new THREE.MeshToonMaterial({ color: c, gradientMap: ramp });
  let hz: MountRig, inner: THREE.Object3D;
  if (!kind.body || kind.body === 'horse') { const h = buildHorse({ coat: kind.tint ?? 0x6a4630, ...(kind.horse ?? {}) }); hz = h; inner = h.root; }
  else { /* fera de montaria: o corpo de bicho em escala de cavalo; a sela vai no lombo (altura medida) */
    const W = kind.body === 'wolf' ? buildWolf({ fur: kind.tint ?? 0x8a847c }) : kind.body === 'boar' ? buildBoar({ fur: kind.tint }) : buildCat({ coat: kind.tint, stripes: true, eye: 0xffc040 });
    const holder = new THREE.Group(), K = kind.body === 'wolf' ? 1.75 : kind.body === 'boar' ? 2.3 : 5.6; holder.scale.setScalar(K); holder.add(W.root);
    holder.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(holder), top = bb.max.y * 0.86;
    const back = new THREE.Group(); back.position.set(0, top, kind.body === 'boar' ? 0.05 : 0); holder.parent; const wrap = new THREE.Group(); wrap.add(holder, back);
    const maxMv = kind.body === 'wolf' ? 6.5 : kind.body === 'boar' ? 4.5 : 5.5; /* a passada da fera tem limite: o resto é chão passando */
    hz = { seat: top, body: back, pose: (p) => (W.pose as (q: { dt: number; mv: number; wind: number; strike: number; hurt: number; idle?: boolean }) => void)({ dt: p.dt, mv: Math.min(maxMv, p.mv * 0.6), wind: 0, strike: 0, hurt: 0, idle: p.idle }) };
    inner = wrap; }
  const sb = hz.body, sy = !kind.body || kind.body === 'horse' ? 0.3 : 0.02, sz = !kind.body || kind.body === 'horse' ? 0.12 : 0, sK = !kind.body || kind.body === 'horse' ? 1 : 1.2;
  const seatG = new THREE.SphereGeometry(0.22 * sK, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); const saddle = new THREE.Mesh(seatG, tm(0x4a2a16)); saddle.scale.set(1.05, 0.35, 1.45); saddle.position.set(0, sy, sz); sb.add(saddle);
  const pommel = new THREE.Mesh(new THREE.TorusGeometry(0.1 * sK, 0.035, 6, 12, Math.PI), tm(0x3a2010)); pommel.position.set(0, sy + 0.06, sz + 0.28 * sK); sb.add(pommel);
  const cantle = new THREE.Mesh(new THREE.TorusGeometry(0.14 * sK, 0.04, 6, 14, Math.PI), tm(0x3a2010)); cantle.position.set(0, sy + 0.06, sz - 0.28 * sK); sb.add(cantle);
  const blanket = new THREE.Mesh(new THREE.SphereGeometry(0.3 * sK, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.2), tm(kind.cloth ?? 0x8a2a2a)); blanket.scale.set(1.0, 0.25, 1.35); blanket.position.set(0, sy - 0.03, sz - 0.02); sb.add(blanket);
  for (const sx of [-1, 1]) { const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.42, 4), tm(0x2a1a0e)); strap.position.set(sx * 0.27 * sK, sy - 0.22, sz + 0.02); sb.add(strap); const st = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 5, 10), tm(0xc9a24a)); st.position.set(sx * 0.27 * sK, sy - 0.44, sz + 0.02); sb.add(st); }
  if (hz.neck) { const rein = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.008, 4, 20, Math.PI), tm(0x2a1a0e)); rein.rotation.set(Math.PI / 2, 0, 0); rein.position.set(0, 0.25, 0.42); hz.neck.add(rein); }
  root.add(inner); mergeStatic(inner, ramp);
  return { root, hz };
}

export function createPet(scene: THREE.Scene, kind: PetKind, heightAt: (x: number, z: number) => number, walkable?: (x: number, z: number) => boolean) {
  const pm = petModel(kind), root = pm.root; fine(root); scene.add(root);
  const pos = new THREE.Vector3(), tgt = new THREE.Vector3(); let yaw = 0, placed = false, idleT = 0;
  const el = document.createElement('div'); el.className = 'npc pet'; el.innerHTML = `<b>${kind.name}</b>`; document.body.appendChild(el); if (kind.silent) el.style.display = 'none';
  let carrying = false;
  /** goal: ponto para onde o pet vai (item para pegar) ou null → segue o herói */
  function update(dt: number, t: number, hero: THREE.Vector3, heroYaw: number, goal: THREE.Vector3 | null, camera: THREE.Camera, canvas: HTMLCanvasElement) {
    if (!placed) { pos.set(hero.x - Math.sin(heroYaw) * 1.4, 0, hero.z - Math.cos(heroYaw) * 1.4); placed = true; }
    if (goal) tgt.copy(goal); else { const back = 1.5 + Math.sin(t * 0.5) * 0.3; tgt.set(hero.x - Math.sin(heroYaw) * back + Math.cos(heroYaw) * 0.9, 0, hero.z - Math.cos(heroYaw) * back - Math.sin(heroYaw) * 0.9); }
    const dx = tgt.x - pos.x, dz = tgt.z - pos.z, dd = Math.hypot(dx, dz);
    const far = Math.hypot(hero.x - pos.x, hero.z - pos.z);
    if (far > 26) { pos.set(hero.x - Math.sin(heroYaw) * 1.4, 0, hero.z - Math.cos(heroYaw) * 1.4); }
    let mv = 0;
    if (dd > (goal ? 0.5 : 0.9)) { const sp = Math.min(kind.speed, dd * 3) * dt, sx = dx / dd * Math.min(sp, dd), sz = dz / dd * Math.min(sp, dd);
      /* o pet respeita paredes e móveis como o herói (Erling 26/10: "estou passando DENTRO da casa"): tenta o passo, senão desliza num eixo; preso longe do dono → reaparece atrás dele */
      if (!walkable || walkable(pos.x + sx, pos.z + sz)) { pos.x += sx; pos.z += sz; } else if (walkable(pos.x + sx, pos.z)) pos.x += sx; else if (walkable(pos.x, pos.z + sz)) pos.z += sz; else if (far > 6) pos.set(hero.x - Math.sin(heroYaw) * 1.4, 0, hero.z - Math.cos(heroYaw) * 1.4);
      mv = Math.min(kind.speed, dd * 3); const w = Math.atan2(dx, dz); let df = w - yaw; while (df > Math.PI) df -= 6.283; while (df < -Math.PI) df += 6.283; yaw += df * Math.min(1, dt * 8); idleT = 0; }
    else { idleT += dt; if (!goal && idleT > 1.5) { const w = heroYaw; let df = w - yaw; while (df > Math.PI) df -= 6.283; while (df < -Math.PI) df += 6.283; yaw += df * Math.min(1, dt * 2); } }
    pos.y = heightAt(pos.x, pos.z);
    root.position.copy(pos); root.rotation.y = yaw;
    pm.pose(dt, mv, t);
    carrying = !!goal;
    const v = new THREE.Vector3(pos.x, pos.y + 0.9 * kind.scale, pos.z).project(camera); const r = canvas.getBoundingClientRect(); const show = v.z < 1 && far < 16 && root.visible;
    if (!kind.silent) el.style.display = show ? 'block' : 'none'; if (show && !kind.silent) { el.style.left = r.left + (v.x * 0.5 + 0.5) * r.width + 'px'; el.style.top = r.top + (-v.y * 0.5 + 0.5) * r.height + 'px'; }
  }
  function dispose() { scene.remove(root); el.remove(); }
  return { kind, pos, update, dispose, get carrying() { return carrying; }, root };
}

export function createMount(scene: THREE.Scene, kind: MountKind) {
  const mm = mountModel(kind), root = mm.root, hz = mm.hz; fine(root); root.visible = false; scene.add(root);
  const seatY = () => (hz.seat + 0.04) * kind.scale * MOUNT_K; // altura do assento em relação ao chão
  function update(dt: number, t: number, pos: THREE.Vector3, yaw: number, moveSp: number) {
    root.visible = true; root.position.copy(pos); root.rotation.y = yaw; void t;
    hz.pose({ dt, mv: moveSp / Math.max(0.5, kind.scale), idle: moveSp < 0.1 });
  }
  function hide() { root.visible = false; }
  return { kind, update, hide, seatY, root };
}
