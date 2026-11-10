/* TECLAS (10/11, Erling: "não temos uma tela de definição de teclas").
   O jogo inteiro lê as teclas padrão. Aqui fica uma camada na frente: a tecla que o jogador escolheu vira a tecla padrão da ação
   antes de chegar no jogo. Assim nenhuma parte do jogo precisa saber que a tecla mudou, e o controle (controle.ts) usa o mesmo caminho. */
export interface Acao { id: string; nome: string; def: string; grupo: string }
export const ACOES: Acao[] = [
  { id: 'cima', nome: 'Andar para cima', def: 'w', grupo: 'Movimento' }, { id: 'baixo', nome: 'Andar para baixo', def: 's', grupo: 'Movimento' },
  { id: 'esq', nome: 'Andar para a esquerda', def: 'a', grupo: 'Movimento' }, { id: 'dir', nome: 'Andar para a direita', def: 'd', grupo: 'Movimento' },
  { id: 'dash', nome: 'Dash', def: ' ', grupo: 'Movimento' }, { id: 'correr', nome: 'Correr / andar', def: 'r', grupo: 'Movimento' }, { id: 'montar', nome: 'Montaria', def: 'z', grupo: 'Movimento' },
  ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d, i) => ({ id: 'm' + d, nome: `Magia ${i + 1} da barra`, def: d, grupo: 'Luta' })),
  { id: 'combate', nome: 'Modo de combate', def: 'Tab', grupo: 'Luta' }, { id: 'instinto', nome: 'Instinto', def: 'f', grupo: 'Luta' }, { id: 'postura', nome: 'Trocar postura', def: 'v', grupo: 'Luta' },
  { id: 'usar', nome: 'Usar / falar / pegar', def: 'e', grupo: 'Mundo' }, { id: 'mapa', nome: 'Mapa', def: 'm', grupo: 'Mundo' }, { id: 'construir', nome: 'Construir', def: 'b', grupo: 'Mundo' },
  { id: 'mochila', nome: 'Mochila', def: 'i', grupo: 'Janelas' }, { id: 'personagem', nome: 'Personagem', def: 'c', grupo: 'Janelas' }, { id: 'missoes', nome: 'Missões', def: 'j', grupo: 'Janelas' },
  { id: 'magias', nome: 'Magias', def: 'k', grupo: 'Janelas' }, { id: 'feitos', nome: 'Feitos', def: 'l', grupo: 'Janelas' }, { id: 'oficios', nome: 'Ofícios', def: 'y', grupo: 'Janelas' },
  { id: 'loja', nome: 'Loja', def: 't', grupo: 'Janelas' }, { id: 'compendio', nome: 'Compêndio', def: 'u', grupo: 'Janelas' }, { id: 'estabulo', nome: 'Estábulo', def: 'x', grupo: 'Janelas' },
  { id: 'mudo', nome: 'Som: mudo', def: 'o', grupo: 'Som' }, { id: 'musica', nome: 'Música: liga / desliga', def: 'p', grupo: 'Som' },
];
const LS = 'karmika.teclas';
let bind: Record<string, string> = {};
try { const j = JSON.parse(localStorage.getItem(LS) ?? '{}') as Record<string, string>; for (const a of ACOES) if (typeof j[a.id] === 'string' && j[a.id] !== a.def) bind[a.id] = j[a.id]; } catch { /* */ }
const save = () => { try { localStorage.setItem(LS, JSON.stringify(bind)); } catch { /* */ } };
export const teclaDe = (id: string) => bind[id] ?? ACOES.find((a) => a.id === id)!.def;
/** a tecla física, do jeito que o jogo a chama: dígito pelo lugar no teclado (Shift+1 continua sendo 1), letra minúscula, o resto pelo nome */
const fis = (e: KeyboardEvent) => { const d = /^Digit(\d)$/.exec(e.code); return d ? d[1] : e.key.length === 1 ? e.key.toLowerCase() : e.key; };
const codeOf = (k: string) => /^\d$/.test(k) ? 'Digit' + k : /^[a-z]$/.test(k) ? 'Key' + k.toUpperCase() : k === ' ' ? 'Space' : k;
export const nomeTecla = (k: string) => k === ' ' ? 'Espaço' : k === 'Tab' ? 'Tab' : k.startsWith('Arrow') ? ({ ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' } as Record<string, string>)[k] ?? k : k.length === 1 ? k.toUpperCase() : k;
/** manda uma tecla padrão para o jogo (a camada de teclas e o controle usam) */
export function mandaTecla(type: 'keydown' | 'keyup', key: string, mods: { shiftKey?: boolean; ctrlKey?: boolean; repeat?: boolean } = {}) {
  const ev = new KeyboardEvent(type, { key, code: codeOf(key), bubbles: true, cancelable: true, shiftKey: !!mods.shiftKey, ctrlKey: !!mods.ctrlKey, repeat: !!mods.repeat });
  (ev as unknown as { __k: boolean }).__k = true; (document.body ?? window).dispatchEvent(ev);
}
let ouvindo: ((k: string | null) => void) | null = null;
const noCampo = (e: Event) => { const t = e.target as HTMLElement | null; return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || !!t.isContentEditable); };
function onKey(e: KeyboardEvent) {
  if ((e as unknown as { __k?: boolean }).__k || !e.isTrusted) return;
  if (ouvindo) { e.preventDefault(); e.stopImmediatePropagation(); if (e.type !== 'keydown') return; const f = ouvindo; if (['Shift', 'Control', 'Alt', 'Meta', 'Enter'].includes(e.key)) return; ouvindo = null; f(e.key === 'Escape' ? null : fis(e)); return; }
  if (!Object.keys(bind).length || noCampo(e) || e.altKey || e.metaKey) return;
  const k = fis(e); let alvo: string | null = null, tomada = false;
  for (const a of ACOES) { const cur = bind[a.id] ?? a.def; if (cur === k) { alvo = a.def; break; } if (a.def === k && bind[a.id]) tomada = true; }
  if (alvo === null && !tomada) return; /* tecla que ninguém trocou: segue como sempre */
  if (alvo === k) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (alvo !== null) mandaTecla(e.type as 'keydown' | 'keyup', alvo, { shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, repeat: e.repeat });
}
addEventListener('keydown', onKey, true); addEventListener('keyup', onKey, true);
/** espera a próxima tecla (Esc cancela) */
export const ouvirTecla = (f: (k: string | null) => void) => { ouvindo = f; };
export const ouvindoTecla = () => !!ouvindo;
/** troca a tecla de uma ação; se a tecla já era de outra, as duas trocam de lugar */
export function trocarTecla(id: string, k: string) {
  const antiga = teclaDe(id); for (const a of ACOES) if (a.id !== id && teclaDe(a.id) === k) { if (antiga === a.def) delete bind[a.id]; else bind[a.id] = antiga; }
  const a = ACOES.find((x) => x.id === id)!; if (k === a.def) delete bind[id]; else bind[id] = k; save();
}
export function teclasPadrao() { bind = {}; save(); }
export const teclasMudadas = () => Object.keys(bind).length;
