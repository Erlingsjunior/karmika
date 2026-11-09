/* AS REGRAS DOS DADOS (07/11, Erling: "um MMORPG raiz: dano mínimo e máximo, acerto e erro crítico pelos dados, contra a defesa do inimigo;
   cada magia vai somando dados"). Documento: claude/regras-dos-dados-07-11.md.
   PRINCÍPIO: a média de cada golpe é a mesma de antes dos dados — os dados mudam a sensação, não o equilíbrio.
   Este módulo só sorteia e descreve; quem aplica é o combate (gameplay.ts) e os monstros (enemies.ts). */

export const d = (n: number) => 1 + Math.floor(Math.random() * n);
export const d20 = () => d(20);
export const diceAvg = (sides: number[]) => sides.reduce((s, n) => s + (n + 1) / 2, 0);
export function rollDice(sides: number[]) { const faces = sides.map(d); return { faces, sum: faces.reduce((a, b) => a + b, 0) }; }
/** "2d4+1d8" */
export function fmtDice(sides: number[]) { const m = new Map<number, number>(); for (const s of sides) m.set(s, (m.get(s) ?? 0) + 1); return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([s, n]) => `${n}d${s}`).join('+') || '—'; }

/** a escada dos dados da mão: a partir de cada nível, o conjunto ganha dados novos */
const LADDER: [number, number[]][] = [[1, [4, 4]], [10, [4, 4, 8]], [20, [4, 8, 12]], [40, [8, 12, 20]], [60, [12, 12, 20]], [80, [12, 20, 20]], [100, [20, 20, 20]], [130, [12, 20, 20, 20]]];
export const ladderAt = (L: number) => { let t = LADDER[0][1]; for (const [lv, s] of LADDER) if (L >= lv) t = s; return t; };
/** os dados da mão do herói e o bônus que completa a média de sempre (12 × (1 + 5% por nível)) */
export function heroHand(L: number) { const dice = ladderAt(L), avg = 12 * (1 + 0.05 * (L - 1)); return { dice, avg, bonus: avg - diceAvg(dice) }; }
/** o grau da magia soma dados (o bônus de grau, que já existia, passa a vir rolado) */
export function rankDice(rank: number) { const r: number[] = []; if (rank >= 1) r.push(4); if (rank >= 3) r.push(8); if (rank >= 6) r.push(12); if (rank >= 10) r.push(20); return r; }
/** faixa de crítico no d20: cada 5% de chance abre uma face (20; 19–20; …), teto 10 faces (11–20) */
export const critFaces = (p: number) => Math.max(1, Math.min(10, Math.round(p * 20)));

/** os dados de ataque de um monstro com a média do dano dele; bicho fraco usa dados menores */
const SMALL: number[][] = [[4], [6], [4, 4], [8], [4, 8], [6, 8], [8, 8]];
const monCache = new Map<string, number[]>();
export function monDice(avg: number, lvl: number) { const k = `${Math.round(avg)}|${lvl}`; const c = monCache.get(k); if (c) return c;
  let dice = ladderAt(lvl); if (diceAvg(dice) > avg * 0.6) { dice = [4]; for (const s of SMALL) if (diceAvg(s) <= avg * 0.6) dice = s; }
  monCache.set(k, dice); return dice; }
/** rola o golpe de um monstro (média = o dano dele) e guarda a descrição para o registro de rolagens */
export let lastMon: { at: number; txt: string } = { at: 0, txt: '' };
export function monRoll(avg: number, lvl: number, name: string) { const dice = monDice(avg, lvl), r = rollDice(dice), bonus = avg - diceAvg(dice), v = Math.max(1, Math.round(r.sum + bonus));
  lastMon = { at: performance.now(), txt: `${fmtDice(dice)} (${r.faces.join(',')})` }; void name; return v; }

/* ---------- acerto contra defesa ---------- */
export const heroAcc = (L: number, dex: number) => 8 + L / 2.5 + dex / 12;
/** a Defesa (CD) do monstro contra o herói; bicho bem acima do seu nível escorrega mais (o "ERROU" antigo) */
export const monCD = (mL: number, agile: boolean, dl: number) => 10 + mL / 2.5 + (agile ? 2 : 0) + Math.max(0, dl - 2) * 0.6;
export const monAcc = (mL: number) => 8 + mL / 2.5;
export const heroCD = (L: number, dex: number, cloak: boolean) => 10 + L / 2.5 + dex / 4 + (cloak ? 2 : 0);
/** o número mínimo no d20 para acertar (o 1 sempre erra, o 20 sempre acerta) */
export const needOf = (cd: number, acc: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.ceil(cd - acc)));

/* ---------- o Registro de Rolagens (canto da tela, como numa mesa) ---------- */
let box: HTMLElement | null = null; let on = (() => { try { return localStorage.getItem('karmika.rolls') !== '0'; } catch { return true; } })();
/* 09/11 (Erling: "achei o lugar ideal para os dados"): o botão 🎲 fica ao lado do 📜 do registro do sistema, no alto à esquerda.
   Cada um liga e desliga sozinho; com os dois ligados, as duas listas correm lado a lado (o sistema à esquerda, os dados logo depois). */
let tog: HTMLButtonElement | null = null;
/* 09/11 (Erling: "as mensagens vindo ABAIXO dos ícones e não do lado; a de sistema pequena como a dos dados, mais discreta; e os dados vêm primeiro
   para não ficar a tela vazia"): os dois ícones ficam no alto; embaixo deles a lista dos dados; e logo abaixo dela, o registro do sistema, do mesmo
   tamanho e na mesma letra. Se os dados estão desligados (ou vazios), o registro sobe e encosta nos ícones. */
function layout() { if (!box) return; const lg = document.getElementById('log'), ic = document.getElementById('logtog'); /* 09/11: a lista única começa 10 px abaixo dos ícones */ const TOP = ic ? Math.round(ic.getBoundingClientRect().bottom + 10) : 84, LEFT = 14;
  box.style.display = 'none'; if (lg) { lg.style.setProperty('top', TOP + 'px', 'important'); lg.style.setProperty('left', LEFT + 'px', 'important'); } }
function ensure() { if (box) return box; box = document.createElement('div'); box.id = 'rolls'; box.innerHTML = '<div class="rl"></div>'; document.body.appendChild(box);
  tog = document.createElement('button'); tog.id = 'rolltog'; tog.textContent = '🎲'; document.body.appendChild(tog);
  const apply = () => { box!.classList.toggle('off', !on); tog!.classList.toggle('off', !on); tog!.title = on ? 'Esconder o Registro de Rolagens (cada golpe é um d20 contra a Defesa e os dados de dano)' : 'Mostrar o Registro de Rolagens: cada golpe é um d20 contra a Defesa e os dados de dano'; layout(); };
  tog.addEventListener('click', () => { on = !on; try { localStorage.setItem('karmika.rolls', on ? '1' : '0'); } catch { /* */ } apply(); });
  document.getElementById('logtog')?.addEventListener('click', () => setTimeout(layout, 0)); addEventListener('resize', layout); setInterval(layout, 400); apply(); return box; }
if (typeof document !== 'undefined') { const boot = () => { if (document.body.classList.contains('ready')) ensure(); else setTimeout(boot, 1000); }; setTimeout(boot, 1000); }
/** 07/11 (Erling: "nome do monstro e algumas coisas na linha de cima, outras na de baixo; acerto crítico em verde, erro crítico em vermelho; mais curto"):
    linha 1 = quem (⚔ você bate / 🛡 você apanha) e o veredito; linha 2 = os dados, curtos */
export type RollKind = 'crit' | 'fail' | 'miss' | 'hit' | 'hurt';
export function rollLog(who: string, verdict: string, kind: RollKind, dice: string, mine = true) {
  if (!document.body.classList.contains('ready')) return; ensure(); if (!on) return;
  /* 09/11 (Erling: "as mensagens uma a uma no mesmo espaço, dado, sistema, dado, sistema… tudo junto intercalado"): a rolagem entra na MESMA lista
     do registro do sistema (#log), na ordem em que acontece */
  const l = document.getElementById('log'); if (!l) return;
  const p = document.createElement('div'); p.className = `roll ${kind}`; p.innerHTML = `<span class="r1"><i class="ic">${mine ? '⚔' : '🛡'}</i><b class="who">${who}</b><em class="vd">${verdict}</em></span><span class="r2">🎲 ${dice}</span>`;
  l.appendChild(p); while (l.children.length > 8) l.firstElementChild!.remove(); setTimeout(() => { p.style.opacity = '0'; setTimeout(() => p.remove(), 600); }, 7000); }

/* 07/11 EQUILÍBRIO ENTRE CLASSES (simulação: claude/regras-matematicas-07-11.md): o dano por segundo de cada caminho, com as magias de verdade,
   contra um alvo, de equipamento raro. Meta: corpo a corpo = 1,00 do Guerreiro do Norte; à distância = 0,90 (bate sem apanhar).
   Este número corrige quem saía muito acima ou muito abaixo; as magias de área e de controle continuam valendo por cima. */
export const KIT_BAL: Record<string, number> = { nordic: 1, human: 1.12, dwarf: 0.96, technocrat: 0.53, tecno: 0.95, pal: 0.81, vam: 0.66, lob: 0.76, cac: 0.68, mag: 1.5, bru: 1.75, elf: 1.5 };
