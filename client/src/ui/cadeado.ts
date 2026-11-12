/* O CADEADO (12/11, Erling: "se estiver fechado, um cadeado semitransparente na frente; quando abrir, ele faz uma animação de cadeado abrindo e se quebra,
   a magia brilha e fica disponível; isso em tudo: talentos, passivas e até magias").
   Uma peça só para as três telas: o desenho do cadeado, a camada que vai por cima do que está trancado e a memória do que já foi visto aberto
   (a animação de abrir toca UMA vez, na primeira vez em que a coisa aparece destrancada depois de ter sido vista trancada). */
const KEY = 'karmika.cadeados.v1';
let visto: Record<string, 0 | 1> = {}; try { visto = JSON.parse(localStorage.getItem(KEY) || '{}') ?? {}; } catch { visto = {}; }
let sujo = false; const salva = () => { if (sujo) return; sujo = true; setTimeout(() => { sujo = false; try { localStorage.setItem(KEY, JSON.stringify(visto)); } catch { /* */ } }, 400); };
/** anota o estado de agora e diz se a coisa ACABOU de abrir (estava anotada como trancada e agora está aberta) */
export function acabouDeAbrir(id: string, aberto: boolean): boolean { const antes = visto[id]; if (antes === (aberto ? 1 : 0)) return false; visto[id] = aberto ? 1 : 0; salva(); return antes === 0 && aberto; }
const SVG = (cls: string) => `<svg class="${cls}" viewBox="0 0 24 28" aria-hidden="true"><path class="arco" d="M7 12V8a5 5 0 0110 0v4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><g class="corpo"><rect x="3.5" y="11.5" width="17" height="13.5" rx="3" fill="currentColor"/><path d="M12 16.2a1.7 1.7 0 011 3.1V22h-2v-2.7a1.7 1.7 0 011-3.1z" fill="#1a1208"/></g></svg>`;
/** a camada do cadeado: `trancado` mostra o cadeado parado; `abrindo` toca a animação e some */
export const cadeado = (trancado: boolean, abrindo: boolean) => trancado ? `<span class="cad">${SVG('cadsvg')}</span>` : abrindo ? `<span class="cad abre">${SVG('cadsvg')}<i></i></span>` : '';
let posto = false;
export function cadeadoCss() { if (posto || typeof document === 'undefined') return; posto = true; const st = document.createElement('style'); st.id = 'cadcss';
  st.textContent = `.cad{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;z-index:3;color:#e8c870}.cad .cadsvg{width:var(--cad,30px);height:auto;opacity:.5;filter:drop-shadow(0 2px 4px #000)}
.cad.abre .cadsvg{opacity:1;animation:cadsai 1.25s ease-in forwards}.cad.abre .arco{transform-origin:17px 12px;animation:cadarco .5s ease-out forwards}.cad.abre i{position:absolute;inset:-6px;border-radius:inherit;animation:cadluz 1.3s ease-out forwards;pointer-events:none}
@keyframes cadarco{0%{transform:none}60%,100%{transform:rotate(38deg) translateY(-2px)}}
@keyframes cadsai{0%,38%{transform:none;opacity:1;filter:drop-shadow(0 0 0 #ffe08a)}55%{transform:scale(1.35);opacity:1;filter:drop-shadow(0 0 10px #ffe08a) brightness(1.6)}100%{transform:translateY(16px) rotate(18deg) scale(.7);opacity:0}}
@keyframes cadluz{0%,35%{box-shadow:0 0 0 0 rgba(255,224,138,0)}55%{box-shadow:0 0 26px 6px rgba(255,224,138,.85),inset 0 0 22px rgba(255,224,138,.45)}100%{box-shadow:0 0 0 0 rgba(255,224,138,0)}}`;
  document.head.appendChild(st); }
