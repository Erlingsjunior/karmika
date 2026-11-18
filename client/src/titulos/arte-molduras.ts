/* A ARTE DAS MOLDURAS (Erling, 16/11: "faça molduras bonitas com runas em volta; faça molduras diferentes e lindas").
   Cada moldura é um desenho vetorial próprio, montado aqui e usado como borda de nove fatias: os cantos ficam inteiros e as laterais, com
   as runas, se repetem até fechar a volta, em qualquer tamanho de retrato. Cada uma tem metal, runas, cantos, enfeite de borda e brasão. */

/* runas do futhark antigo, riscadas numa caixa de 10 por 20 */
const RUNAS = [
  'M2 20V0M2 7L9 2M2 13L9 8', 'M2 20V0L8 6V20', 'M2 20V0M2 5L8 10L2 15', 'M2 20V0M2 2L9 7M2 8L9 13', 'M2 20V0L8 5L2 10L8 20', 'M8 3L2 10L8 17',
  'M1 2L9 18M9 2L1 18', 'M2 20V0L8 5L2 10', 'M2 0V20M8 0V20M2 7L8 13', 'M5 0V20M1 6L9 13', 'M5 20V0M1 6L5 0L9 6', 'M2 20V0L8 5L2 10L8 15L2 20',
  'M2 20V0L8 8M8 20V0L2 8', 'M3 20V0L8 6', 'M5 20V0M1 0L5 7L9 0', 'M7 0L2 6L8 12L3 20', 'M1 20L8 10L5 3L2 10L9 20', 'M5 0V20M1 4L9 10M1 10L9 16',
];
type Canto = 'prego' | 'placa' | 'gema' | 'sol' | 'gota' | 'espinho' | 'garra' | 'roseta' | 'engrenagem' | 'estrela' | 'rasgo' | 'olho';
type Borda = 'veio' | 'rebite' | 'filete' | 'duplo' | 'cristal' | 'espinho' | 'dente' | 'vitral' | 'parafuso' | 'fio' | 'corte' | 'esmalte';
type Brasao = '' | 'coroa' | 'gota' | 'lua' | 'presas' | 'cruz' | 'roda' | 'fuso' | 'tesoura' | 'olho';
interface Arte { /** metal: claro, meio, escuro */ m: [string, string, string]; /** cor da runa e do brilho dela ('' = entalhada, sem brilho) */ r: string; rb: string; canto: Canto; borda: Borda; brasao: Brasao; /** segunda cor (gema, esmalte, sangue) */ c2: string; /** luz em volta da moldura */ luz: string }
export const ARTES: Record<string, Arte> = {
  madeira: { m: ['#a67c4e', '#6e4a26', '#3a2412'], r: '#1e1208', rb: '', canto: 'prego', borda: 'veio', brasao: '', c2: '#8a8f96', luz: '' },
  ferro: { m: ['#c2cad2', '#7c8690', '#3c444e'], r: '#1a2028', rb: '', canto: 'placa', borda: 'rebite', brasao: '', c2: '#dfe6ee', luz: '' },
  prata: { m: ['#ffffff', '#b9c4d6', '#66728a'], r: '#2a3a66', rb: '#cfe0ff', canto: 'gema', borda: 'filete', brasao: '', c2: '#7ab8ff', luz: '#cfe0ff55' },
  ouro: { m: ['#fff0b0', '#e0a830', '#7a4a0c'], r: '#5a2c04', rb: '#fff2b0', canto: 'sol', borda: 'duplo', brasao: 'coroa', c2: '#e0303a', luz: '#ffc84a88' },
  lagrima: { m: ['#f2fbff', '#8fd0f2', '#2a6a9a'], r: '#0c3e6a', rb: '#ffffff', canto: 'gota', borda: 'cristal', brasao: 'gota', c2: '#c8f2ff', luz: '#7ad0ffaa' },
  sombra: { m: ['#5a3a7a', '#24103a', '#08020e'], r: '#e2b0ff', rb: '#a04aff', canto: 'espinho', borda: 'espinho', brasao: 'lua', c2: '#a04aff', luz: '#a04affaa' },
  cacada: { m: ['#f4ead2', '#c8b48c', '#6e5a3a'], r: '#8a1410', rb: '', canto: 'garra', borda: 'dente', brasao: 'presas', c2: '#8a1410', luz: '#ff5a3a55' },
  catedral: { m: ['#4a4650', '#2a2830', '#101014'], r: '#ffe9a0', rb: '#ffd24a', canto: 'roseta', borda: 'vitral', brasao: 'cruz', c2: '#ffd24a', luz: '#ffd24a66' },
  oficio: { m: ['#f0c468', '#b07a2a', '#5a3a12'], r: '#2e1c06', rb: '', canto: 'engrenagem', borda: 'parafuso', brasao: 'roda', c2: '#3a2a12', luz: '#ffb04044' },
  fio: { m: ['#fffaf0', '#ecd9a6', '#b08a3a'], r: '#5e3602', rb: '#fffbe6', canto: 'estrela', borda: 'fio', brasao: 'fuso', c2: '#ffffff', luz: '#ffe6a0aa' },
  desf: { m: ['#3a1014', '#1a0608', '#060102'], r: '#ff5a5a', rb: '#ff1a2a', canto: 'rasgo', borda: 'corte', brasao: 'tesoura', c2: '#e0202a', luz: '#ff2a3aaa' },
  fundador: { m: ['#fff6cc', '#e8b83a', '#8a5a10'], r: '#fff8dc', rb: '#ffe680', canto: 'olho', borda: 'esmalte', brasao: 'olho', c2: '#4a2a8a', luz: '#fff0a0cc' },
};

/* o canto, desenhado na caixa 0..30 do alto à esquerda (os outros três são este, girado) */
function canto(a: Arte): string { const [c, , e] = a.m, k = a.c2;
  switch (a.canto) {
    case 'prego': return `<circle cx="15" cy="15" r="6.5" fill="#2a2e34"/><circle cx="15" cy="15" r="5" fill="${k}"/><circle cx="13.4" cy="13.2" r="1.6" fill="#fff" opacity=".7"/>`;
    case 'placa': return `<rect x="3" y="3" width="24" height="24" fill="${a.m[1]}" stroke="${e}" stroke-width="1.5"/><path d="M6 6L24 24M24 6L6 24" stroke="${e}" stroke-width="2"/>${[[7, 7], [23, 7], [7, 23], [23, 23]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${k}" stroke="${e}" stroke-width=".6"/>`).join('')}<circle cx="15" cy="15" r="3.4" fill="${c}" stroke="${e}"/>`;
    case 'gema': return `<path d="M15 1L29 15L15 29L1 15Z" fill="${c}" stroke="${e}" stroke-width="1.2"/><path d="M15 6L24 15L15 24L6 15Z" fill="${k}" stroke="#fff" stroke-width=".8"/><path d="M15 6L15 24M6 15L24 15" stroke="#fff" stroke-width=".6" opacity=".7"/>`;
    case 'sol': return `${[0, 45, 90, 135, 180, 225, 270, 315].map((g) => `<path d="M15 0L17.6 8L12.4 8Z" fill="${c}" stroke="${e}" stroke-width=".5" transform="rotate(${g} 15 15)"/>`).join('')}<circle cx="15" cy="15" r="8.5" fill="${a.m[1]}" stroke="${e}" stroke-width="1.2"/><circle cx="15" cy="15" r="4.6" fill="${k}" stroke="#ffd0d0" stroke-width=".7"/><circle cx="13.6" cy="13.6" r="1.3" fill="#fff" opacity=".8"/>`;
    case 'gota': return `<circle cx="15" cy="15" r="13" fill="${a.m[2]}" opacity=".55"/><path d="M15 2C15 2 26 14 26 20A11 9 0 0 1 4 20C4 14 15 2 15 2Z" fill="${k}" stroke="#fff" stroke-width="1.1"/><path d="M10 19A5 4 0 0 0 14 24" stroke="#fff" stroke-width="1.4" fill="none" opacity=".9"/>`;
    case 'espinho': return `${[0, 60, 120, 180, 240, 300].map((g) => `<path d="M15 -3L18.5 12L11.5 12Z" fill="${e}" stroke="${k}" stroke-width=".7" transform="rotate(${g} 15 15)"/>`).join('')}<circle cx="15" cy="15" r="6" fill="#06010a" stroke="${k}" stroke-width="1.2"/><circle cx="15" cy="15" r="2.6" fill="${k}"/>`;
    case 'garra': return `<circle cx="15" cy="15" r="12.5" fill="${k}" stroke="${e}" stroke-width="1.2"/><path d="M6 4Q13 14 8 26M13 3Q20 14 15 27M20 4Q27 14 22 26" stroke="${c}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    case 'roseta': return `<circle cx="15" cy="15" r="13" fill="#0c0c10"/>${['#d0303a', '#2a5ad0', '#e0b030', '#2a9a5a'].map((cor, i) => `<path d="M15 15L15 3A12 12 0 0 1 27 15Z" fill="${cor}" stroke="#0c0c10" stroke-width="1.4" transform="rotate(${i * 90} 15 15)"/>`).join('')}<circle cx="15" cy="15" r="4" fill="${k}" stroke="#0c0c10" stroke-width="1.2"/>`;
    case 'engrenagem': return `${[0, 45, 90, 135, 180, 225, 270, 315].map((g) => `<rect x="12" y="0" width="6" height="7" fill="${a.m[1]}" stroke="${e}" stroke-width=".7" transform="rotate(${g} 15 15)"/>`).join('')}<circle cx="15" cy="15" r="10" fill="${c}" stroke="${e}" stroke-width="1.2"/><circle cx="15" cy="15" r="4.2" fill="${k}" stroke="${e}"/><path d="M15 6V10M15 20V24M6 15H10M20 15H24" stroke="${e}" stroke-width="1.4"/>`;
    case 'estrela': return `<circle cx="15" cy="15" r="11" fill="${a.m[2]}" opacity=".5"/><path d="M15 0Q16.5 13.5 30 15Q16.5 16.5 15 30Q13.5 16.5 0 15Q13.5 13.5 15 0Z" fill="${k}" stroke="${e}" stroke-width=".8"/><circle cx="15" cy="15" r="2.4" fill="${a.m[1]}"/>`;
    case 'rasgo': return `<rect x="1" y="1" width="28" height="28" fill="#060102" stroke="${k}" stroke-width="1"/><path d="M3 5L26 27M8 2L28 20M2 12L19 28" stroke="${k}" stroke-width="2.2" stroke-linecap="round"/><path d="M27 3L4 26" stroke="#ff9a9a" stroke-width="1" opacity=".8"/>`;
    case 'olho': return `<path d="M15 0L30 15L15 30L0 15Z" fill="${k}" stroke="${c}" stroke-width="1.6"/><path d="M4 15Q15 5 26 15Q15 25 4 15Z" fill="#fff8dc" stroke="${e}" stroke-width=".8"/><ellipse cx="15" cy="15" rx="2.6" ry="5.4" fill="#e0621a"/><ellipse cx="15" cy="15" rx="1" ry="4.4" fill="#1a0a02"/>`;
  }
}
/* o enfeite da lateral, desenhado na faixa de cima (x 30..120, y 0..30); as outras três são esta, girada */
function borda(a: Arte, lado: number): string { const [c, m, e] = a.m, k = a.c2;
  switch (a.borda) {
    case 'veio': return `<path d="M30 6Q60 3 90 7T120 5M30 24Q55 27 85 23T120 25M30 15Q50 13 62 16" stroke="${e}" stroke-width=".9" fill="none" opacity=".6"/>`;
    case 'rebite': return [60, 90].map((x) => `<circle cx="${x}" cy="15" r="3" fill="${k}" stroke="${e}" stroke-width=".9"/><circle cx="${x - .8}" cy="14.2" r="1" fill="#fff" opacity=".8"/>`).join('') + `<path d="M30 3.5H120M30 26.5H120" stroke="${e}" stroke-width="1" opacity=".7"/>`;
    case 'filete': return `<path d="M30 4H120M30 26H120" stroke="${e}" stroke-width=".9"/><path d="M30 6.4H120M30 23.6H120" stroke="#fff" stroke-width=".7" opacity=".8"/>${[60, 90].map((x) => `<path d="M${x} 11L${x + 3} 15L${x} 19L${x - 3} 15Z" fill="${k}" stroke="${e}" stroke-width=".6"/>`).join('')}`;
    case 'duplo': return `<path d="M30 3.5H120M30 26.5H120" stroke="${e}" stroke-width="1.6"/><path d="M30 6.5H120M30 23.5H120" stroke="${c}" stroke-width="1"/>${[60, 90].map((x) => `<circle cx="${x}" cy="15" r="2.4" fill="${k}" stroke="${e}" stroke-width=".7"/>`).join('')}`;
    case 'cristal': return `<path d="M30 30L38 20L46 30L55 17L63 30L70 21L78 30L88 16L96 30L104 21L112 30L120 24V30Z" fill="${k}" opacity=".55"/><path d="M30 0L40 8L50 0L62 10L74 0L84 7L96 0L108 9L120 0Z" fill="#fff" opacity=".4"/>`;
    case 'espinho': return [36, 54, 72, 90, 108].map((x, i) => `<path d="M${x - 5} 0L${x} ${i % 2 ? 9 : 12}L${x + 5} 0Z" fill="#06010a" stroke="${k}" stroke-width=".6"/>`).join('') + `<path d="M30 27H120" stroke="${k}" stroke-width="1" opacity=".8"/>`;
    case 'dente': return `<rect x="30" y="22" width="90" height="8" fill="${k}"/>` + [35, 45, 55, 65, 75, 85, 95, 105, 115].map((x, i) => `<path d="M${x - 4} 30L${x} ${i % 2 ? 23 : 20}L${x + 4} 30Z" fill="#fffaf0" stroke="${e}" stroke-width=".5"/>`).join('') + `<path d="M30 3H120" stroke="${e}" stroke-width="1"/>`;
    case 'vitral': { const cores = [['#c8283a', '#2a56c8', '#d8a828'], ['#2a9a5a', '#c8283a', '#2a56c8'], ['#d8a828', '#2a9a5a', '#c8283a'], ['#2a56c8', '#d8a828', '#2a9a5a']][lado]; return cores.map((cor, i) => `<path d="M${30 + i * 30} 4H${60 + i * 30}V26H${30 + i * 30}Z" fill="${cor}" opacity=".85"/><path d="M${30 + i * 30} 4L${60 + i * 30} 26M${60 + i * 30} 4L${30 + i * 30} 26" stroke="#0c0c10" stroke-width=".8" opacity=".5"/>`).join('') + `<path d="M30 4H120M30 26H120M30 0V30M60 0V30M90 0V30" stroke="#0c0c10" stroke-width="2"/>`; }
    case 'parafuso': return [60, 90].map((x) => `<circle cx="${x}" cy="15" r="3.4" fill="${m}" stroke="${e}" stroke-width="1"/><path d="M${x - 2.2} ${15 - 2.2}L${x + 2.2} ${15 + 2.2}" stroke="${e}" stroke-width="1.1"/>`).join('') + `<path d="M30 4H120M30 26H120" stroke="${e}" stroke-width="1.2"/><path d="M30 6H120" stroke="${c}" stroke-width=".7"/>`;
    case 'fio': return `<path d="M30 4Q37.5 -1 45 4T60 4T75 4T90 4T105 4T120 4" stroke="${e}" stroke-width="1.5" fill="none"/><path d="M30 26Q37.5 31 45 26T60 26T75 26T90 26T105 26T120 26" stroke="${e}" stroke-width="1.5" fill="none"/><path d="M30 4Q37.5 9 45 4T60 4T75 4T90 4T105 4T120 4M30 26Q37.5 21 45 26T60 26T75 26T90 26T105 26T120 26" stroke="${k}" stroke-width="1" fill="none"/>`;
    case 'corte': return `<path d="M34 0L42 9M52 0L57 6M70 0L80 11M95 0L99 5M108 0L117 10M38 30L44 23M61 30L70 20M86 30L90 25M103 30L112 21" stroke="${k}" stroke-width="1.4" stroke-linecap="round"/><path d="M30 1H120" stroke="${k}" stroke-width="1" opacity=".7"/>`;
    case 'esmalte': return `<rect x="30" y="5.5" width="90" height="19" fill="${k}"/><path d="M30 5.5H120M30 24.5H120" stroke="${e}" stroke-width="1.2"/><path d="M30 2.6H120M30 27.4H120" stroke="#fff" stroke-width=".8" opacity=".85"/>${[60, 90].map((x) => `<path d="M${x} 9L${x + 3.4} 15L${x} 21L${x - 3.4} 15Z" fill="${c}" stroke="${e}" stroke-width=".5"/>`).join('')}`;
  }
}
const svg = (w: number, h: number, corpo: string) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${corpo}</svg>`)}")`;
/** o azulejo de 150 por 150 da moldura: cantos de 30 e laterais de 90 com três runas cada */
export function azulejo(id: string): string { const a = ARTES[id] ?? ARTES.madeira, [c, m, e] = a.m, n = Object.keys(ARTES).indexOf(id) * 5;
  const lado = (i: number) => { const runas = [0, 1, 2].map((j) => { const d = RUNAS[(n + i * 3 + j * 7) % RUNAS.length], t = `translate(${40 + j * 30} 5)`;
      return (a.rb ? `<path d="${d}" transform="${t}" stroke="${a.rb}" stroke-width="5" opacity=".55" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : `<path d="${d}" transform="translate(${40.9 + j * 30} 5.9)" stroke="${c}" stroke-width="2" opacity=".55" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
        + `<path d="${d}" transform="${t}" stroke="${a.r}" stroke-width="2.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; }).join('');
    return `<g transform="rotate(${i * 90} 75 75)"><rect x="30" y="0" width="90" height="30" fill="url(#g)"/>${borda(a, i)}${runas}${canto(a)}</g>`; };
  return svg(150, 150, `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}"/><stop offset=".22" stop-color="${m}"/><stop offset=".7" stop-color="${m}"/><stop offset="1" stop-color="${e}"/></linearGradient></defs>
    <path fill-rule="evenodd" d="M0 0H150V150H0ZM30 30V120H120V30Z" fill="${m}"/><path d="M.8 .8H149.2V149.2H.8Z" fill="none" stroke="${e}" stroke-width="1.6"/><path d="M29.2 29.2H120.8V120.8H29.2Z" fill="none" stroke="${e}" stroke-width="1.6"/>${[0, 1, 2, 3].map(lado).join('')}`); }
/** o brasão do alto da moldura (40 por 40); '' se a moldura não tem */
export function brasao(id: string): string { const a = ARTES[id] ?? ARTES.madeira, [c, m, e] = a.m, k = a.c2; let d = '';
  switch (a.brasao) {
    case 'coroa': d = `<path d="M4 32L2 12L12 22L20 6L28 22L38 12L36 32Z" fill="${m}" stroke="${e}" stroke-width="1.6"/><path d="M4 32H36V37H4Z" fill="${c}" stroke="${e}" stroke-width="1.2"/><circle cx="20" cy="8" r="3" fill="${k}" stroke="#fff" stroke-width=".8"/><circle cx="3" cy="12" r="2.2" fill="${k}"/><circle cx="37" cy="12" r="2.2" fill="${k}"/>`; break;
    case 'gota': d = `<path d="M20 2C20 2 34 19 34 27A14 11 0 0 1 6 27C6 19 20 2 20 2Z" fill="${k}" stroke="#fff" stroke-width="1.6"/><path d="M13 26A7 6 0 0 0 19 33" stroke="#fff" stroke-width="2" fill="none"/>`; break;
    case 'lua': d = `<circle cx="20" cy="20" r="16" fill="#06010a" stroke="${k}" stroke-width="1.4"/><path d="M26 6A15 15 0 1 0 26 34A11.5 11.5 0 1 1 26 6Z" fill="${a.r}" stroke="${k}" stroke-width="1"/>`; break;
    case 'presas': d = `<path d="M4 6H36L33 14H7Z" fill="${k}" stroke="${e}" stroke-width="1.2"/><path d="M8 12L13 36L18 12ZM22 12L27 36L32 12Z" fill="#fffaf0" stroke="${e}" stroke-width="1.2"/>`; break;
    case 'cruz': d = `<circle cx="20" cy="20" r="17" fill="#101014" stroke="${k}" stroke-width="1.6"/><path d="M17 5H23V17H35V23H23V35H17V23H5V17H17Z" fill="${k}" stroke="#0c0c10" stroke-width="1"/><circle cx="20" cy="20" r="3" fill="#c8283a"/>`; break;
    case 'roda': d = `${[0, 45, 90, 135, 180, 225, 270, 315].map((g) => `<rect x="16" y="1" width="8" height="9" fill="${m}" stroke="${e}" stroke-width="1" transform="rotate(${g} 20 20)"/>`).join('')}<circle cx="20" cy="20" r="13" fill="${c}" stroke="${e}" stroke-width="1.6"/><circle cx="20" cy="20" r="5" fill="${k}" stroke="${e}"/>`; break;
    case 'fuso': d = `<path d="M20 1L27 20L20 39L13 20Z" fill="${k}" stroke="${e}" stroke-width="1.4"/><path d="M13.5 14Q20 18 26.5 14M13 20Q20 24 27 20M13.5 26Q20 30 26.5 26" stroke="${e}" stroke-width="1.3" fill="none"/><path d="M27 20Q36 16 38 6" stroke="${m}" stroke-width="1.6" fill="none"/>`; break;
    case 'tesoura': d = `<circle cx="20" cy="20" r="17" fill="#060102" stroke="${k}" stroke-width="1.4"/><path d="M11 6L24 26M29 6L16 26" stroke="#e8e8ee" stroke-width="2.6" stroke-linecap="round"/><circle cx="14" cy="31" r="4" fill="none" stroke="${k}" stroke-width="2.2"/><circle cx="26" cy="31" r="4" fill="none" stroke="${k}" stroke-width="2.2"/>`; break;
    case 'olho': d = `<path d="M20 1L39 20L20 39L1 20Z" fill="${k}" stroke="${c}" stroke-width="2"/><path d="M5 20Q20 6 35 20Q20 34 5 20Z" fill="#fff8dc" stroke="${e}" stroke-width="1"/><ellipse cx="20" cy="20" rx="4" ry="8" fill="#e0621a"/><ellipse cx="20" cy="20" rx="1.5" ry="6.6" fill="#1a0a02"/>`; break;
    default: return ''; }
  return svg(40, 40, d); }
/** as regras de CSS de todas as molduras (titulos-ui.ts põe na página uma vez) */
export function cssMolduras(): string { return Object.keys(ARTES).map((id) => { const b = brasao(id), a = ARTES[id];
  return `.mo-${id}::before{border-image-source:${azulejo(id)};${a.luz ? `box-shadow:inset 0 0 calc(var(--mt)*.7) ${a.luz.slice(0, 7)}55;` : ''}}.mo-${id}{--mg:${a.luz || 'transparent'}}${b ? `.mo-${id}::after{background-image:${b}}` : `.mo-${id}::after{display:none}`}`; }).join('\n'); }
