/* ÁRVORE DE TALENTOS (03/11, Erling: "um sistema de árvores mais complexo, com skills que não são apenas magias — que dão destreza, força,
   vitalidade, energia; recarga mais rápida, conjuração mais veloz, andar mais rápido… cada classe com a sua força e uma árvore bem legal para
   gastar pontos e fazer uma jornada").
   Modelo (estudo: Path of Exile 2, Diablo IV e WoW, ver claude/mercenario-e-arvores-03-11.md e claude/arvore-de-talentos-03-11.md):
   - uma constelação por classe, com o CENTRO aceso; três braços, um para cada papel da classe (o mesmo das posturas: ataque, defesa e o
     terceiro jeito dela), e um anel de atributos ligando os braços (dá para cruzar de um braço para o outro);
   - pontos PEQUENOS (+atributo ou +%), pontos NOTÁVEIS (com nome, efeito maior) e, na ponta de cada braço, uma PEDRA-CHAVE (troca forte:
     ganha muito e perde alguma coisa);
   - só se acende um ponto ligado a outro já aceso; tirar um ponto só se ele não segurar outros;
   - pontos de talento: 1 a cada 2 níveis e +1 a cada 10 (no 60 dá ~35, o que fecha uma árvore quase inteira — mas não as três pedras de uma vez sem abrir mão de algo).
   Os efeitos somam no recalc da mochila (inventory.ts) e no gameplay (recarga e velocidade de golpe/conjuração). */
export type TStat = 'str' | 'dex' | 'vit' | 'int' | 'hp' | 'dmg' | 'crit' | 'arm' | 'move' | 'aspd' | 'cdr' | 'regen' | 'gen' | 'leech' | 'heal' | 'mp';
export const TSTAT_TXT: Record<TStat, (v: number) => string> = {
  str: (v) => `+${v} de Força`, dex: (v) => `+${v} de Destreza`, vit: (v) => `+${v} de Vitalidade`, int: (v) => `+${v} de Energia`,
  hp: (v) => `${v > 0 ? '+' : ''}${v}% de vida máxima`, dmg: (v) => `${v > 0 ? '+' : ''}${v}% de dano`, crit: (v) => `${v > 0 ? '+' : ''}${v}% de crítico`,
  arm: (v) => `${v > 0 ? '+' : ''}${v} de armadura`, move: (v) => `${v > 0 ? '+' : ''}${v}% de velocidade de movimento`, aspd: (v) => `${v > 0 ? '+' : ''}${v}% de velocidade de golpe e conjuração`,
  cdr: (v) => `${v > 0 ? '+' : ''}${v}% de velocidade de recarga das magias`, regen: (v) => `+${v} de vida por segundo`, gen: (v) => `+${v}% de geração do recurso`,
  leech: (v) => `+${v}% de roubo de vida`, heal: (v) => `+${v}% de cura recebida`, mp: (v) => `+${v} de recurso máximo`,
};
export type Eff = Partial<Record<TStat, number>>;
export interface TNode { id: string; x: number; y: number; kind: 'start' | 'small' | 'notable' | 'key' | 'socket'; name: string; eff: Eff; tip?: string; links: string[]; branch: number; /** pontos já gastos NESTE braço para abrir (portão) */ req?: number; /** nível de classe que abre o anel */ lvl?: number; /** raio no desenho, em unidades da árvore */ rad?: number }
interface Branch { name: string; col: string; small: Eff[]; notables: [string, Eff][]; key: [string, Eff, string] }
interface ClassDef { name: string; ring: Eff[]; branches: [Branch, Branch, Branch] }

const A = (k: TStat, v: number): Eff => ({ [k]: v });
const C: Record<string, ClassDef> = {
  human: { name: 'Humano', ring: [A('str', 5), A('vit', 5), A('dex', 5), A('int', 5)], branches: [
    { name: 'Armas do Povo', col: '#e8b870', small: [A('str', 5), A('dmg', 3), A('crit', 2)], notables: [['Mão Calejada', { dmg: 8, aspd: 5 }], ['Golpe de Lavrador', { str: 10, crit: 4 }]], key: ['Teimosia Humana', { dmg: 18, hp: 10, move: -5 }, 'Não sabe fugir: mais dano e vida, anda um pouco mais devagar.'] },
    { name: 'Defesa', col: '#8ab8e8', small: [A('vit', 5), A('arm', 12), A('hp', 3)], notables: [['Couro Grosso', { arm: 40, hp: 6 }], ['De Pé até o Fim', { vit: 10, regen: 1 }]], key: ['Muro de Aldeia', { arm: 120, hp: 15, dmg: -10 }, 'Aguenta tudo, bate menos.'] },
    { name: 'Comunidade', col: '#7aff9a', small: [A('dex', 5), A('move', 2), A('heal', 4)], notables: [['Pés de Estrada', { move: 6, dex: 6 }], ['Remédio de Vó', { heal: 15, regen: 1 }]], key: ['Vizinho de Todos', { heal: 30, cdr: 10, dmg: -6 }, 'Cura e magias voltam mais rápido; menos dano.'] },
  ] },
  nordic: { name: 'Guerreiro do Norte', ring: [A('str', 5), A('vit', 5), A('str', 5), A('dex', 5)], branches: [
    { name: 'Berserker', col: '#ff6a4a', small: [A('str', 6), A('dmg', 3), A('aspd', 2)], notables: [['Sangue Quente', { dmg: 10, aspd: 6 }], ['Machado Faminto', { leech: 2, crit: 5 }]], key: ['Berserkir', { dmg: 25, aspd: 10, arm: -60 }, 'Sem medo: muito mais dano e velocidade de golpe, armadura cai.'] },
    { name: 'Guardião do Escudo', col: '#9ad7ff', small: [A('vit', 6), A('arm', 15), A('hp', 3)], notables: [['Parede de Tílias', { arm: 50, hp: 6 }], ['Juramento de Ulfar', { vit: 12, regen: 1.5 }]], key: ['Muralha de Escudos', { arm: 150, hp: 18, move: -8 }, 'Ninguém passa: armadura e vida enormes, anda mais devagar.'] },
    { name: 'Skald', col: '#ffe08a', small: [A('int', 5), A('cdr', 3), A('heal', 4)], notables: [['Canção de Bravura', { cdr: 8, gen: 10 }], ['Hino de Eir', { heal: 18, regen: 1 }]], key: ['Voz de Odin', { cdr: 18, gen: 20, dmg: -8 }, 'Gritos e curas voltam muito mais rápido; menos dano direto.'] },
  ] },
  dwarf: { name: 'Anão', ring: [A('str', 5), A('vit', 6), A('str', 5), A('vit', 6)], branches: [
    { name: 'Quebra-Montanhas', col: '#ff8a3a', small: [A('str', 6), A('dmg', 3), A('crit', 2)], notables: [['Martelo Pesado', { dmg: 12 }], ['Racha-Rocha', { crit: 6, str: 8 }]], key: ['Colosso', { dmg: 28, aspd: -10, hp: 10 }, 'Cada martelada é um terremoto: muito mais dano, golpe mais lento.'] },
    { name: 'Guardião do Salão', col: '#9aa4b4', small: [A('vit', 6), A('arm', 18), A('hp', 3)], notables: [['Pé de Pedra', { arm: 60, vit: 8 }], ['Barba de Ferro', { hp: 10, regen: 1 }]], key: ['Portão de Ferro', { arm: 180, hp: 15, move: -10 }, 'Vira uma porta de fortaleza: imenso de defesa, lento para andar.'] },
    { name: 'Ferreiro Rúnico', col: '#ffd24a', small: [A('int', 5), A('cdr', 3), A('gen', 4)], notables: [['Runas Quentes', { cdr: 8, dmg: 5 }], ['Forja Viva', { gen: 15, aspd: 4 }]], key: ['Forja Eterna', { cdr: 15, gen: 25, hp: -8 }, 'As runas nunca esfriam: recurso e recarga voando, menos vida.'] },
  ] },
  elf: { name: 'Elfa', ring: [A('dex', 6), A('int', 5), A('dex', 6), A('vit', 4)], branches: [
    { name: 'Olho de Falcão', col: '#9aff8a', small: [A('dex', 6), A('crit', 2), A('dmg', 3)], notables: [['Mira Firme', { crit: 8, dmg: 6 }], ['Flecha Funda', { dmg: 10, dex: 8 }]], key: ['Olho de Falcão', { crit: 14, dmg: 18, arm: -50 }, 'Cada flecha procura o coração: crítico e dano muito altos, quase sem armadura.'] },
    { name: 'Dança do Vento', col: '#8ad0ff', small: [A('move', 2), A('dex', 5), A('aspd', 2)], notables: [['Passo de Folha', { move: 6, aspd: 5 }], ['Arco Ligeiro', { aspd: 8, dex: 6 }]], key: ['Dança do Vento', { move: 12, aspd: 12, dmg: -10 }, 'Atira e corre sem parar: muito mais veloz, menos dano por flecha.'] },
    { name: 'Espírito da Mata', col: '#c8e8a0', small: [A('int', 5), A('heal', 4), A('regen', 0.5)], notables: [['Seiva', { regen: 1.5, heal: 12 }], ['Voz da Floresta', { cdr: 10, int: 8 }]], key: ['Filha da Mata', { heal: 30, regen: 3, dmg: -8 }, 'A mata cura quem a respeita: muita cura, menos dano.'] },
  ] },
  tecno: { name: 'Tecnocrata', ring: [A('int', 6), A('dex', 5), A('int', 6), A('vit', 5)], branches: [
    { name: 'Artilheiro', col: '#6ae0ff', small: [A('int', 6), A('dmg', 3), A('crit', 2)], notables: [['Cano Longo', { dmg: 10, crit: 4 }], ['Sobrepressão', { dmg: 8, gen: 10 }]], key: ['Posto Fixo', { dmg: 25, cdr: 10, move: -12 }, 'Planta os pés e despeja: muito dano e recarga, anda bem mais devagar.'] },
    { name: 'Engenheiro de Cerco', col: '#9aa4b4', small: [A('vit', 5), A('arm', 14), A('cdr', 3)], notables: [['Caldeira Reforçada', { arm: 45, hp: 6 }], ['Engrenagem Fina', { cdr: 10, aspd: 4 }]], key: ['Engenheiro Andarilho', { cdr: 20, move: 6, dmg: -8 }, 'As engenhocas voltam muito mais rápido e ele anda leve; menos dano.'] },
    { name: 'Granadeiro', col: '#ffb04a', small: [A('dex', 5), A('aspd', 2), A('gen', 4)], notables: [['Pavio Curto', { aspd: 8, dmg: 5 }], ['Válvula Aberta', { gen: 15, cdr: 5 }]], key: ['Caldeira Instável', { dmg: 20, aspd: 10, hp: -12 }, 'A caldeira no limite: mais dano e velocidade, menos vida.'] },
  ] },
  pal: { name: 'Paladino', ring: [A('str', 5), A('vit', 6), A('int', 5), A('vit', 6)], branches: [
    { name: 'Vingança', col: '#ffd24a', small: [A('str', 6), A('dmg', 3), A('crit', 2)], notables: [['Juízo', { dmg: 10, crit: 4 }], ['Lâmina Sagrada', { dmg: 8, str: 8 }]], key: ['Fogo Sagrado', { dmg: 24, heal: -15 }, 'A luz que corta: muito mais dano, cura menos.'] },
    { name: 'Bastião', col: '#fff0c0', small: [A('vit', 6), A('arm', 16), A('hp', 3)], notables: [['Fé de Ferro', { arm: 55, hp: 6 }], ['Escudo da Aurora', { vit: 12, regen: 1 }]], key: ['Juramento', { arm: 160, hp: 18, move: -6 }, 'Não recua: armadura e vida enormes, anda mais devagar.'] },
    { name: 'Graça', col: '#bfffd0', small: [A('int', 5), A('heal', 5), A('cdr', 3)], notables: [['Mão que Cura', { heal: 18, regen: 1 }], ['Oração Rápida', { cdr: 10, gen: 8 }]], key: ['Martírio', { heal: 35, cdr: 12, hp: -10 }, 'Dá a própria vida pela dos outros: cura e recarga altas, menos vida.'] },
  ] },
  vam: { name: 'Vampiro', ring: [A('dex', 6), A('str', 5), A('dex', 6), A('int', 4)], branches: [
    { name: 'Caçada Noturna', col: '#c84a6a', small: [A('dex', 6), A('move', 2), A('aspd', 2)], notables: [['Sombra Rápida', { move: 6, aspd: 6 }], ['Presas', { crit: 6, dmg: 6 }]], key: ['Filho da Noite', { aspd: 14, move: 8, arm: -50 }, 'Rápido como a sombra: velocidade enorme, quase sem armadura.'] },
    { name: 'Sangue Antigo', col: '#8a0a1a', small: [A('vit', 5), A('leech', 1), A('heal', 4)], notables: [['Gole Lento', { leech: 3, regen: 1 }], ['Sangue do Conde', { hp: 10, leech: 2 }]], key: ['Banquete', { leech: 6, heal: 20, regen: -1 }, 'Cura só bebendo: roubo de vida enorme, a vida não volta sozinha.'] },
    { name: 'Fúria Rubra', col: '#ff3a4a', small: [A('str', 6), A('dmg', 3), A('crit', 2)], notables: [['Sede', { dmg: 10, gen: 10 }], ['Garras de Sangue', { crit: 6, str: 8 }]], key: ['Fome Cega', { dmg: 26, crit: 8, hp: -12 }, 'A sede vence a razão: muito dano, menos vida.'] },
  ] },
  lob: { name: 'Lobisomem', ring: [A('str', 6), A('vit', 6), A('dex', 5), A('vit', 6)], branches: [
    { name: 'Fúria da Lua', col: '#ff8a4a', small: [A('str', 6), A('dmg', 3), A('aspd', 2)], notables: [['Garra Larga', { dmg: 10, aspd: 4 }], ['Uivo', { crit: 5, gen: 10 }]], key: ['Sem Correntes', { dmg: 26, aspd: 10, arm: -60 }, 'A besta solta: muito dano e velocidade, armadura cai.'] },
    { name: 'Pele Velha', col: '#a08060', small: [A('vit', 6), A('arm', 16), A('hp', 3)], notables: [['Couro de Ancião', { arm: 55, hp: 6 }], ['Carne Dura', { regen: 1.5, vit: 10 }]], key: ['Pele de Prata', { arm: 150, hp: 18, dmg: -8 }, 'Couro que até a prata respeita: defesa enorme, bate menos.'] },
    { name: 'Matilha', col: '#c8e8a0', small: [A('dex', 5), A('heal', 4), A('move', 2)], notables: [['Lamber Feridas', { heal: 18, regen: 1 }], ['Faro', { move: 6, crit: 4 }]], key: ['Alfa', { heal: 25, move: 8, dmg: -6 }, 'A matilha cuida do alfa: cura e velocidade, um pouco menos de dano.'] },
  ] },
  mag: { name: 'Mago', ring: [A('int', 6), A('int', 6), A('dex', 4), A('vit', 4)], branches: [
    { name: 'Tempestade', col: '#8ab0ff', small: [A('int', 6), A('dmg', 3), A('crit', 2)], notables: [['Raio Fino', { crit: 6, dmg: 6 }], ['Fogo Vivo', { dmg: 12 }]], key: ['Mente Única', { dmg: 28, cdr: -10 }, 'Um só elemento, até o fim: muito dano, recarga mais lenta.'] },
    { name: 'Égide', col: '#c8d8ff', small: [A('vit', 5), A('arm', 12), A('mp', 6)], notables: [['Véu de Força', { arm: 45, hp: 8 }], ['Mana Funda', { mp: 25, regen: 0.8 }]], key: ['Égide de Mana', { arm: 120, mp: 40, dmg: -10 }, 'A mana vira couraça: defesa e mana altas, menos dano.'] },
    { name: 'Fonte', col: '#9affea', small: [A('int', 5), A('cdr', 3), A('aspd', 2)], notables: [['Palavra Rápida', { aspd: 10, cdr: 4 }], ['Fluxo', { cdr: 10, gen: 10 }]], key: ['Sobrecarga', { aspd: 16, cdr: 16, hp: -12 }, 'Conjura sem parar: velocidade e recarga enormes, menos vida.'] },
  ] },
  bru: { name: 'Bruxo', ring: [A('int', 6), A('vit', 5), A('int', 6), A('str', 4)], branches: [
    { name: 'Praga', col: '#9aff4a', small: [A('int', 6), A('dmg', 3), A('crit', 2)], notables: [['Peste', { dmg: 10, cdr: 4 }], ['Olho Mau', { crit: 6, int: 8 }]], key: ['Credor', { dmg: 26, crit: 6, heal: -15 }, 'A praga cobra caro: muito dano, cura menos.'] },
    { name: 'Pacto de Sangue', col: '#a01a3a', small: [A('vit', 5), A('leech', 1), A('hp', 3)], notables: [['Sangue Emprestado', { leech: 3, hp: 6 }], ['Contrato', { gen: 12, regen: 1 }]], key: ['Corte de Demônios', { leech: 5, hp: 15, cdr: -8 }, 'Os demônios pagam a sua vida: roubo e vida altos, recarga mais lenta.'] },
    { name: 'Círculo', col: '#b08ae8', small: [A('vit', 5), A('arm', 12), A('cdr', 3)], notables: [['Sal e Sombra', { arm: 45, cdr: 5 }], ['Selo', { hp: 8, regen: 1 }]], key: ['Círculo Fechado', { arm: 140, hp: 12, move: -8 }, 'Dentro do círculo ninguém entra inteiro: defesa enorme, mais lento.'] },
  ] },
  cac: { name: 'Caçador de Demônios', ring: [A('dex', 6), A('int', 4), A('dex', 6), A('vit', 5)], branches: [
    { name: 'Prata', col: '#e8f0ff', small: [A('dex', 6), A('crit', 2), A('dmg', 3)], notables: [['Bala de Prata', { dmg: 10, crit: 4 }], ['Execução', { crit: 8, dmg: 4 }]], key: ['Prata Pura', { dmg: 25, crit: 8, hp: -10 }, 'Feito para matar o que não devia existir: muito dano, menos vida.'] },
    { name: 'Emboscada', col: '#8ad0a0', small: [A('move', 2), A('dex', 5), A('aspd', 2)], notables: [['Pés Leves', { move: 7, aspd: 4 }], ['Rearmar Rápido', { aspd: 8, cdr: 6 }]], key: ['Ermitão', { move: 10, aspd: 12, arm: -50 }, 'Ninguém o vê chegar: velocidade enorme, quase sem armadura.'] },
    { name: 'Vigília', col: '#b0b8c8', small: [A('vit', 6), A('arm', 14), A('cdr', 3)], notables: [['Noite em Claro', { arm: 45, regen: 1 }], ['Armadilheiro', { cdr: 12, int: 6 }]], key: ['Vigília Eterna', { arm: 130, cdr: 12, dmg: -8 }, 'A noite inteira de pé: defesa e armadilhas que voltam rápido, menos dano.'] },
  ] },
};
C.technocrat = C.tecno;
/* 04/11: A ÁRVORE DE TODOS — a mesma para qualquer raça, classe e grau de classe. Três braços da tríade (ataque, defesa, cura) e o anel dos
   quatro atributos. O centro é o Olho Kármico. */
C.geral = { name: 'Karmika', ring: [A('str', 5), A('vit', 5), A('dex', 5), A('int', 5)], branches: [
  { name: 'Ataque', col: '#ff8a5a', small: [A('str', 5), A('dmg', 3), A('crit', 2), A('dex', 5), A('aspd', 2)], notables: [['Mão Calejada', { dmg: 8, aspd: 5 }], ['Olho no Alvo', { crit: 6, dex: 6 }]], key: ['Fúria do Caminho', { dmg: 18, aspd: 6, arm: -40 }, 'Tudo no golpe: muito mais dano e velocidade, menos armadura.'] },
  { name: 'Defesa', col: '#8ab8e8', small: [A('vit', 5), A('arm', 12), A('hp', 3), A('str', 4)], notables: [['Couro Grosso', { arm: 40, hp: 6 }], ['De Pé até o Fim', { vit: 10, regen: 1 }]], key: ['Muralha Viva', { arm: 130, hp: 15, move: -6 }, 'Aguenta tudo: armadura e vida enormes, anda mais devagar.'] },
  { name: 'Cura', col: '#7aff9a', small: [A('int', 5), A('heal', 4), A('regen', 0.5), A('move', 2), A('cdr', 3)], notables: [['Remédio de Vó', { heal: 15, regen: 1 }], ['Pés de Estrada', { move: 6, dex: 5 }]], key: ['Fonte Interior', { heal: 30, cdr: 10, dmg: -8 }, 'Cura forte e magias que voltam rápido; menos dano.'] },
] };

const cacheT = new Map<string, TNode[]>();
/** monta a constelação da classe (posições em uma grade de -10 a 10) */
export function treeOf(kit: string): TNode[] {
  if (kit === 'geral') return treeGeral();
  const k = C[kit] ? kit : 'human'; const hit = cacheT.get(k); if (hit) return hit; const D = C[k]; const N: TNode[] = [];
  const add = (n: Omit<TNode, 'links'>) => { const q = { ...n, links: [] as string[] }; N.push(q); return q; };
  const link = (a: TNode, b: TNode) => { a.links.push(b.id); b.links.push(a.id); };
  const start = add({ id: 'o', x: 0, y: 0, kind: 'start', name: k === 'geral' ? 'Olho Kármico' : `Coração de ${D.name}`, eff: {}, branch: -1 });
  const ANG = [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6]; /* em cima, embaixo à direita, embaixo à esquerda */
  const ringNodes: TNode[][] = [];
  D.branches.forEach((B, bi) => { const a = ANG[bi], ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux; let prev = start; const R: TNode[] = [];
    const seq: ('s' | 'n' | 'k')[] = ['s', 's', 'n', 's', 's', 'n', 'k']; let si = 0, ni = 0;
    seq.forEach((t, i) => { const r = 1.3 + i * 1.15, bend = Math.sin(i * 0.9) * 0.35; const x = ux * r + px * bend, y = uy * r + py * bend;
      const n = t === 's' ? add({ id: `b${bi}s${i}`, x, y, kind: 'small', name: B.name, eff: B.small[si++ % B.small.length], branch: bi })
        : t === 'n' ? add({ id: `b${bi}n${ni}`, x, y, kind: 'notable', name: B.notables[ni][0], eff: B.notables[ni++][1], branch: bi })
        : add({ id: `b${bi}k`, x, y, kind: 'key', name: B.key[0], eff: B.key[1], tip: B.key[2], branch: bi });
      link(prev, n); prev = n; R.push(n);
      /* galhos laterais nos pontos 2 e 5: um ponto pequeno de cada lado */
      if (i === 1 || i === 4) for (const sd of [-1, 1]) { const tw = add({ id: `b${bi}t${i}${sd > 0 ? 'r' : 'l'}`, x: x + px * sd * 1.05 + ux * 0.35, y: y + py * sd * 1.05 + uy * 0.35, kind: 'small', name: B.name, eff: B.small[(si++) % B.small.length], branch: bi }); link(n, tw); } });
    ringNodes.push(R); });
  /* o anel de atributos: entre um braço e o seguinte, dois pontos que ligam o 3º ponto de um ao 3º do outro */
  for (let bi = 0; bi < 3; bi++) { const a = ringNodes[bi][2], b = ringNodes[(bi + 1) % 3][2]; let prev = a;
    for (let j = 1; j <= 2; j++) { const t = j / 3, mx = a.x + (b.x - a.x) * t, my = a.y + (b.y - a.y) * t, out = 1.25; const L = Math.hypot(mx, my) || 1;
      const n = add({ id: `r${bi}${j}`, x: mx / L * (L * out), y: my / L * (L * out), kind: 'small', name: 'Anel dos Atributos', eff: D.ring[(bi * 2 + j) % D.ring.length], branch: 3 }); link(prev, n); prev = n; }
    link(prev, b); }
  /* 04/11 (Erling: "coloque mais 40 em cada ponto da tríade… do mesmo jeito que está, só acrescente mais coisas legais"): cada braço ganha
     5 CONSTELAÇÕES de 8 pontos (40) que saem dos galhos e da pedra-chave para fora. Cada constelação: entra por um ponto pequeno, tem dois
     notáveis no caminho e termina num MESTRE (notável grande). Os bônus são do papel do braço (ataque, defesa ou o terceiro jeito da classe)
     e só usam o que o jogo já aplica de verdade. */
  D.branches.forEach((B, bi) => { const role = roleOf(B), P = POOL[role], R = ringNodes[bi];
    const anchors: TNode[] = [N.find((q) => q.id === `b${bi}t1l`)!, N.find((q) => q.id === `b${bi}t1r`)!, N.find((q) => q.id === `b${bi}t4l`)!, N.find((q) => q.id === `b${bi}t4r`)!, R[R.length - 1]];
    const a0 = ANG[bi];
    anchors.forEach((an, ci) => { const side = ci === 4 ? 0 : ci % 2 ? 1 : -1, ang = a0 + side * (ci < 2 ? 1.15 : 0.62), dd = ci < 2 ? 3.0 : ci < 4 ? 3.6 : 3.3, cx = an.x + Math.cos(ang) * dd, cy = an.y + Math.sin(ang) * dd;
      const seq: ('s' | 'n' | 'm')[] = ['s', 's', 'n', 's', 's', 'n', 's', 'm']; let prev = an;
      seq.forEach((t, j) => { const th = ang + Math.PI + 0.55 + j * ((Math.PI * 2 - 1.1) / 7), rr = 1.5; const x = cx + Math.cos(th) * rr * (j === 7 ? 0 : 1), y = cy + Math.sin(th) * rr * (j === 7 ? 0 : 1);
        const id = `b${bi}c${ci}${j}`, nm = (P.notables[(ci * 2 + (j === 5 ? 1 : 0)) % P.notables.length]);
        const n = t === 's' ? add({ id, x, y, kind: 'small', name: B.name, eff: B.small[(ci + j) % B.small.length], branch: bi })
          : t === 'n' ? add({ id, x, y, kind: 'notable', name: nm[0], eff: nm[1], branch: bi })
          : add({ id, x, y, kind: 'notable', name: `${P.master[ci % P.master.length][0]} de ${B.name}`, eff: P.master[ci % P.master.length][1], tip: P.master[ci % P.master.length][2], branch: bi });
        link(prev, n); prev = n; });
      /* o mestre também liga de volta ao 2º ponto da constelação: dá para entrar pelos dois lados do anel */
      link(prev, N.find((q) => q.id === `b${bi}c${ci}1`)!); }); });
  cacheT.set(k, N); return N;
}
/* 04/11 A ÁRVORE GERAL, DESENHADA EM ANÉIS (Erling: "temos círculos embolados em cima de círculos; deixe o layout bem feito com caminhos,
   alguns itens só se abrem com pontos em outros, slots com espaços para runas kármicas, mais bonito e agradável").
   - O Olho Kármico no centro; cada braço da tríade ocupa a sua FATIA (120°, com folga entre elas) e os pontos ficam em 8 ANÉIS em volta.
   - Em cada anel, os pontos têm distância mínima garantida (o arco entre vizinhos ≥ 2 unidades; os anéis a 1,9): nada encosta em nada.
   - CAMINHOS: cada ponto sai do ponto mais perto do anel de dentro (o braço abre como uma árvore); nos anéis 3 e 6 os vizinhos também se
     ligam de lado — rotas para cruzar o braço.
   - PORTÕES: anéis 4–5 pedem 6 pontos já gastos no braço; 6–7 pedem 15; o mestre e a pedra-chave (anel 8) pedem 22 e 26.
   - ENCAIXES DE RUNA KÁRMICA (3 por braço): acesos, recebem uma das seis runas de Karmika, que reforça os pontos acesos ligados a ele.
   - O anel dos atributos (entre as fatias) liga um braço ao outro. */
const cacheG: { n: TNode[] | null } = { n: null };
function treeGeral(): TNode[] {
  if (cacheG.n) return cacheG.n; const D = C.geral, N: TNode[] = [];
  const add = (n: Omit<TNode, 'links'>) => { const q = { ...n, links: [] as string[] }; N.push(q); return q; };
  const link = (a: TNode, b: TNode) => { if (a.links.includes(b.id)) return; a.links.push(b.id); b.links.push(a.id); };
  const start = add({ id: 'o', x: 0, y: 0, kind: 'start', name: 'Olho Kármico', eff: {}, branch: -1, rad: 1.0 });
  const ANG = [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6], HALF = TREE_HALF, RING = TREE_RING, GAP = TREE_GAP;
  const rings: TNode[][][] = [];
  D.branches.forEach((B, bi) => { const role: Role = (['atk', 'def', 'sup'] as Role[])[bi], P = POOL[role], R: TNode[][] = []; let si = 0, ni = 0, mi = 0;
    const own = B.notables.map((q) => q) as [string, Eff][]; const nots = [...own, ...P.notables];
    for (let k = 1; k <= NR; k++) { const r = 0.6 + RING * k, m = k === NR ? 3 : Math.max(0, Math.floor((HALF * r) / GAP)), cols: number[] = [];
      if (k === NR) cols.push(-3, 0, 3); else for (let c = -m; c <= m; c++) cols.push(c);
      const step = GAP / r, row: TNode[] = [];
      for (const c of cols) { const a = ANG[bi] + c * step, x = Math.cos(a) * r, y = Math.sin(a) * r, id = `b${bi}g${k}_${c + 9}`;
        const req = k === NR ? (c === 0 ? KEY_REQ : RING_REQ[k]) : RING_REQ[k], lvl = k === NR && c === 0 ? KEY_LVL : RING_LVL[k];
        let n: TNode;
        if (k === NR && c === 0) n = add({ id: `b${bi}k`, x, y, kind: 'key', name: B.key[0], eff: B.key[1], tip: B.key[2], branch: bi, req, lvl, rad: 0.95 });
        else if (k === NR) { const M = P.master[mi++ % P.master.length]; n = add({ id, x, y, kind: 'notable', name: `${M[0]} de ${B.name}`, eff: M[1], tip: M[2], branch: bi, req, lvl, rad: 0.8 }); }
        else if ((k === 4 && Math.abs(c) === 2) || (k === 6 && c === 0) || (k === 9 && Math.abs(c) === 4)) n = add({ id, x, y, kind: 'socket', name: 'Encaixe de Runa Kármica', eff: {}, tip: 'Acenda e encaixe uma das seis runas de Karmika: ela reforça os pontos acesos ligados a este encaixe.', branch: bi, req, lvl, rad: 0.62 });
        else if ((k === 3 && c === 0) || (k === 5 && Math.abs(c) === 3) || (k === 7 && (Math.abs(c) === 2 || Math.abs(c) === 5)) || (k === 6 && Math.abs(c) === 3) || (k === 8 && (c === 0 || Math.abs(c) === 5)) || (k === 9 && (c === 0 || Math.abs(c) === 7))) { const q = nots[ni++ % nots.length]; n = add({ id, x, y, kind: 'notable', name: q[0], eff: q[1], branch: bi, req, lvl, rad: 0.7 }); }
        else n = add({ id, x, y, kind: 'small', name: B.name, eff: B.small[si++ % B.small.length], branch: bi, req, lvl, rad: 0.46 });
        row.push(n); }
      R.push(row); }
    /* caminhos: cada ponto liga ao mais perto (em ângulo) do anel de dentro; o anel 1 liga ao Olho */
    for (const n of R[0]) link(start, n);
    for (let k = 1; k < R.length; k++) for (const n of R[k]) { let best = R[k - 1][0], bd = 1e9; for (const q of R[k - 1]) { const d = Math.hypot(q.x - n.x, q.y - n.y); if (d < bd) { bd = d; best = q; } } link(best, n); }
    /* rotas de lado nos anéis 3 e 6 */
    for (const k of [2, 5, 7]) for (let i = 1; i < R[k].length; i++) link(R[k][i - 1], R[k][i]);
    rings.push(R); });
  /* o anel dos atributos, na folga entre as fatias: liga a ponta do anel 2 de um braço à do seguinte */
  for (let bi = 0; bi < 3; bi++) { const a = rings[bi][1][rings[bi][1].length - 1], b = rings[(bi + 1) % 3][1][0], am = ANG[bi] + Math.PI / 3, r = 0.6 + RING * 2.5; /* 04/11: entre os anéis 2 e 3, sem encostar nos pontos dos braços */
    const n1 = add({ id: `r${bi}1`, x: Math.cos(am - 0.12) * r, y: Math.sin(am - 0.12) * r, kind: 'small', name: 'Anel dos Atributos', eff: D.ring[(bi * 2) % 4], branch: 3, rad: 0.46 });
    const n2 = add({ id: `r${bi}2`, x: Math.cos(am + 0.12) * r, y: Math.sin(am + 0.12) * r, kind: 'small', name: 'Anel dos Atributos', eff: D.ring[(bi * 2 + 1) % 4], branch: 3, rad: 0.46 });
    link(a, n1); link(n1, n2); link(n2, b); }
  cacheG.n = N; return N;
}
/* AS SEIS RUNAS KÁRMICAS no encaixe: cada uma reforça um tipo de bônus dos pontos ACESOS ligados ao encaixe (em % do valor deles) */
/** onde ficam os portões (raio entre os anéis) e quantos pontos cada um pede — para o desenho */
/* 04/11 (Erling: "os arcos de level devem chegar até o level ±160: 60 de classe do humano + 120 da Classe I"): 10 anéis; cada anel abre num
   NÍVEL DE CLASSE (somado entre as classes) e, do 5º para fora, também pede pontos já gastos no braço (escolher um caminho é largar outro).
   Conta da balança em docs/classes-graus-e-pontos.md: no nível de classe 180 há 543 pontos para ~1.000 de procura (habilidades + passivas + talentos). */
export const TREE_RING = 3.0, TREE_GAP = 2.88, TREE_HALF = 0.9, NR = 10; /* 05/11 (Erling: "os talentos estão muito próximos, dificulta a leitura"): anéis e vãos 20% mais largos — a mesma conta de pontos por anel, os mesmos ids */
/** nível de classe que abre cada anel (índice = anel 1..10) e pontos no braço que ele pede */
export const RING_LVL = [0, 1, 1, 10, 20, 35, 50, 70, 95, 125, 140], KEY_LVL = 160;
export const RING_REQ = [0, 0, 0, 0, 0, 8, 8, 20, 20, 35, 45], KEY_REQ = 50;
/** onde ficam os arcos (raio entre os anéis), o nível e os pontos que pedem — para o desenho */
export const GATES = [3, 4, 5, 6, 7, 8, 9, 10].map((k) => ({ r: 0.6 + TREE_RING * (k - 0.5), lvl: RING_LVL[k], req: RING_REQ[k], k })).concat([{ r: 0.6 + TREE_RING * (NR + 0.45), lvl: KEY_LVL, req: KEY_REQ, k: NR + 1 }]);
export const ANGS = [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6];
export const RUNE_TALENT: Record<string, { nome: string; txt: string; mul: Partial<Record<TStat, number>>; add?: Eff }> = {
  lagrima: { nome: 'A Lágrima', txt: 'cura e regeneração dos vizinhos +100%', mul: { heal: 1, regen: 1 } },
  olho: { nome: 'O Olho Kármico', txt: 'crítico e dano dos vizinhos +60%', mul: { crit: 0.6, dmg: 0.6 } },
  ampulheta: { nome: 'A Ampulheta', txt: 'recarga, velocidade de golpe e passo dos vizinhos +80%', mul: { cdr: 0.8, aspd: 0.8, move: 0.8 } },
  labirinto: { nome: 'O Labirinto', txt: 'armadura, vida e Vitalidade dos vizinhos +70%', mul: { arm: 0.7, hp: 0.7, vit: 0.7 } },
  fome: { nome: 'A Fome', txt: 'dano dos vizinhos +30% e +1% de roubo de vida', mul: { dmg: 0.3 }, add: { leech: 1 } },
  fresta: { nome: 'A Fresta', txt: 'todos os bônus dos vizinhos +35% (ninguém sabe por quê)', mul: { str: 0.35, dex: 0.35, vit: 0.35, int: 0.35, hp: 0.35, dmg: 0.35, crit: 0.35, arm: 0.35, move: 0.35, aspd: 0.35, cdr: 0.35, regen: 0.35, gen: 0.35, leech: 0.35, heal: 0.35, mp: 0.35 } },
};
type Role = 'atk' | 'def' | 'sup';
/** o papel do braço sai dos bônus pequenos dele: dano/crítico = ataque; armadura/vida = defesa; o resto = o terceiro jeito (cura, recarga, velocidade) */
function roleOf(B: Branch): Role { const k = B.small.flatMap((e) => Object.keys(e)); if (k.includes('dmg') || k.includes('crit')) return 'atk'; if (k.includes('arm') || k.includes('hp') && !k.includes('heal')) return 'def'; return 'sup'; }
const POOL: Record<Role, { notables: [string, Eff][]; master: [string, Eff, string][] }> = {
  atk: { notables: [['Ritmo de Batalha', { aspd: 6, dmg: 4 }], ['Golpe Certeiro', { crit: 5, dmg: 4 }], ['Ferida Aberta', { dmg: 8 }], ['Olhar de Caçador', { crit: 6, dex: 4 }], ['Peso do Braço', { str: 8, dmg: 4 }], ['Fio Afiado', { crit: 4, aspd: 4 }], ['Sem Piedade', { dmg: 6, leech: 1 }], ['Ímpeto', { gen: 10, dmg: 4 }], ['Investida Feroz', { move: 3, dmg: 6 }], ['Mão Pesada', { dmg: 10, aspd: -2 }]],
    master: [['Mestre', { dmg: 12, crit: 4 }, 'O braço inteiro responde: dano e crítico.'], ['Lâmina', { aspd: 8, crit: 5 }, 'Rápido e preciso.'], ['Carrasco', { dmg: 15, hp: -3 }, 'Bate muito mais, guarda um pouco menos.'], ['Tempestade', { aspd: 10, dmg: 6, arm: -15 }, 'Golpes em cascata, menos armadura.'], ['Coração', { dmg: 10, leech: 2, gen: 8 }, 'Cada golpe alimenta o próximo.']] },
  def: { notables: [['Ombro Firme', { arm: 30, vit: 4 }], ['Pele Curtida', { hp: 5, arm: 15 }], ['Fôlego Longo', { regen: 1, vit: 4 }], ['Pé Plantado', { arm: 25, move: -1 }], ['Cicatrizes', { hp: 6, regen: 0.5 }], ['Escudo Erguido', { arm: 35 }], ['Teimoso', { vit: 8, hp: 3 }], ['Sangue Grosso', { hp: 8 }], ['Guarda Alta', { arm: 25, heal: 5 }], ['Raiz', { arm: 40, aspd: -2 }]],
    master: [['Bastião', { arm: 60, hp: 6 }, 'Uma parede de carne e ferro.'], ['Sentinela', { hp: 10, regen: 1.5 }, 'Aguenta a noite inteira.'], ['Rochedo', { arm: 90, move: -4 }, 'Quase nada atravessa; anda mais devagar.'], ['Vigia', { arm: 40, cdr: 6 }, 'Defende e reage rápido.'], ['Carvalho', { vit: 12, hp: 8, regen: 1 }, 'Raízes fundas: vida que não acaba.']] },
  sup: { notables: [['Mão Calma', { heal: 10, regen: 0.5 }], ['Passo Leve', { move: 4, dex: 4 }], ['Respiração', { cdr: 6, gen: 6 }], ['Mente Clara', { int: 8, cdr: 3 }], ['Água da Fonte', { heal: 12 }], ['Fluxo', { gen: 12, mp: 6 }], ['Pés de Vento', { move: 5, aspd: 3 }], ['Bálsamo', { regen: 1, heal: 6 }], ['Paciência', { cdr: 8 }], ['Vontade', { mp: 15, int: 4 }]],
    master: [['Guardião', { heal: 20, cdr: 6 }, 'Cura forte e magias que voltam.'], ['Andarilho', { move: 8, aspd: 6 }, 'Sempre um passo à frente.'], ['Sábio', { cdr: 12, gen: 12 }, 'Recarga e recurso fluindo.'], ['Fonte Viva', { regen: 2, heal: 12, mp: 10 }, 'A vida volta sozinha.'], ['Eco', { cdr: 10, heal: 10, dmg: -4 }, 'Ajuda muito, bate um pouco menos.']] },
};
export const branchesOf = (kit: string) => (C[kit] ?? C.human).branches;
export const classNameOf = (kit: string) => (C[kit] ?? C.human).name;
/** pontos de talento: 1 a cada 2 níveis e +1 a cada 10 */
/* 03/11 (Erling: "quando passo de nível de classe preciso ganhar pontos da minha classe para distribuir"): 1 ponto por NÍVEL DE CLASSE
   (antes: pelo nível geral, 1 a cada 2) */
/* 04/11 (Erling: "3 pontos por nível de classe: evoluir classe dá ponto de classe, evoluir nível base dá ponto de força, vitalidade etc.;
   cada level up pontua uma coisa diferente… precisamos de mais escolhas, mais builds"): 3 pontos de talento por NÍVEL DE CLASSE */
export const talentPoints = (clsLvl: number) => Math.max(3, clsLvl * 3);

export function createTalents(kit: () => string, lvl: () => number, onChange: () => void, pool?: () => number) {
  const KEY = 'karmika.talents.v1'; let all: Record<string, string[]> = {}; try { all = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* */ } };
  /* 04/11: a árvore cresceu (10 anéis); pontos de ids que não existem mais não contam */
  /* 04/11 (Erling: "como posso estar com pontos em talentos de nível 35 trancados?"): os pontos acesos antes dos arcos de nível valem só se o
     anel já abriu para o seu nível de classe e o braço tem os pontos dele; o resto volta sozinho para o monte (sem precisar de personagem novo) */
  let memo: { key: string; ids: string[] } | null = null;
  const mine = (): string[] => { const raw = all[kit()] ?? [], L0 = lvl(), key = kit() + '|' + L0 + '|' + raw.join(','); if (memo && memo.key === key) return memo.ids;
    const T0 = treeOf(kit()), by = new Map(T0.map((n) => [n.id, n])); let ids = raw.filter((id) => { const n = by.get(id); return !!n && (n.lvl ?? 0) <= L0; });
    for (let pass = 0; pass < 6; pass++) { const set = new Set(['o', ...ids]), cnt = [0, 0, 0, 0]; for (const id of ids) { const b = by.get(id)!.branch; if (b >= 0 && b < 4) cnt[b]++; }
      const seen = new Set(['o']), q = ['o']; while (q.length) { const c = by.get(q.pop()!); if (!c) continue; for (const l of c.links) if (set.has(l) && !seen.has(l)) { seen.add(l); q.push(l); } }
      const nx = ids.filter((id) => { const n = by.get(id)!; return seen.has(id) && (n.req ?? 0) <= (n.branch >= 0 && n.branch < 3 ? cnt[n.branch] : 99); }); if (nx.length === ids.length) break; ids = nx; }
    if (ids.length !== raw.length && L0 >= 2) { all[kit()] = ids; save(); } /* (com nível 1 pode ser o jogo ainda carregando: só esconde, não apaga) */
    memo = { key: kit() + '|' + L0 + '|' + ids.join(','), ids }; return ids; };
  const lit = (): Set<string> => new Set(['o', ...mine()]);
  const spent = () => mine().length, avail = () => pool ? Math.max(0, pool()) : Math.max(0, talentPoints(lvl()) - spent()); /* pool = os pontos livres do monte único (habilidades + passivas + talentos) */
  const nodes = () => treeOf(kit()), byId = (id: string) => nodes().find((n) => n.id === id);
  /** dá para acender: ligado a um aceso e há ponto */
  /** pontos gastos num braço */
  const inBranch = (bi: number) => { const L = lit(); return nodes().filter((n) => n.branch === bi && L.has(n.id)).length; };
  /** o portão do ponto: quantos pontos do braço ainda faltam (0 = aberto) */
  const gateLeft = (id: string) => { const n = byId(id); if (!n?.req) return 0; return Math.max(0, n.req - inBranch(n.branch)); };
  /** o arco de nível: quantos níveis de classe ainda faltam (0 = aberto) */
  const lvlLeft = (id: string) => { const n = byId(id); return n?.lvl ? Math.max(0, n.lvl - lvl()) : 0; };
  const canTake = (id: string) => { const L = lit(), n = byId(id); return !!n && !L.has(id) && avail() > 0 && gateLeft(id) === 0 && lvlLeft(id) === 0 && n.links.some((q) => L.has(q)); };
  /** dá para apagar: sem ele, todos os acesos continuam ligados ao centro */
  const canDrop = (id: string) => { const L = lit(); if (id === 'o' || !L.has(id)) return false; L.delete(id);
    /* o portão continua de pé: os pontos de fora do braço ainda têm os pontos que pediram */
    { const gone = byId(id)!; const cnt = nodes().filter((n) => n.branch === gone.branch && L.has(n.id)).length; if (nodes().some((n) => L.has(n.id) && n.branch === gone.branch && (n.req ?? 0) > cnt)) return false; }
    const seen = new Set(['o']), q = ['o'];
    while (q.length) { const c = byId(q.pop()!)!; for (const l of c.links) if (L.has(l) && !seen.has(l)) { seen.add(l); q.push(l); } } return [...L].every((x) => seen.has(x)); };
  function take(id: string) { if (!canTake(id)) return false; (all[kit()] ??= []).push(id); save(); onChange(); return true; }
  function drop(id: string) { if (!canDrop(id)) return false; all[kit()] = (all[kit()] ?? []).filter((x) => x !== id); save(); onChange(); return true; }
  function reset() { all[kit()] = []; delete all[kit() + ':runas']; save(); onChange(); }
  /* runas nos encaixes: { idDoEncaixe: idDaRuna } */
  const runes = (): Record<string, string> => { const r = (all as unknown as Record<string, Record<string, string>>)[kit() + ':runas']; return r ?? {}; };
  function setRune(sock: string, rune: string | null) { const store = all as unknown as Record<string, Record<string, string>>; const r = { ...(store[kit() + ':runas'] ?? {}) }; if (rune) r[sock] = rune; else delete r[sock]; store[kit() + ':runas'] = r; save(); onChange(); }
  /** a soma de tudo o que está aceso */
  function stats(): Eff { const out: Eff = {}; const L = lit(); for (const n of nodes()) if (L.has(n.id)) for (const [k, v] of Object.entries(n.eff) as [TStat, number][]) out[k] = (out[k] ?? 0) + v;
    /* as runas reforçam os vizinhos acesos do encaixe aceso */
    const R = runes(); for (const [sid, rid] of Object.entries(R)) { const sk = byId(sid), RT = RUNE_TALENT[rid]; if (!sk || !RT || !L.has(sid)) continue;
      for (const l of sk.links) { const nb = byId(l); if (!nb || !L.has(l)) continue; for (const [k, v] of Object.entries(nb.eff) as [TStat, number][]) { const m = RT.mul[k]; if (m) out[k] = (out[k] ?? 0) + v * m; } }
      if (RT.add) for (const [k, v] of Object.entries(RT.add) as [TStat, number][]) out[k] = (out[k] ?? 0) + v; }
    return out; }
  return { nodes, lit, spent, avail, canTake, canDrop, take, drop, reset, stats, byId, gateLeft, lvlLeft, inBranch, runes, setRune, lvl };
}
export type Talents = ReturnType<typeof createTalents>;
export const effTxt = (e: Eff) => (Object.entries(e) as [TStat, number][]).map(([k, v]) => TSTAT_TXT[k](Math.round(v * 10) / 10)).join(' · ');
