/* ---------- O REATOR DO TECNOCRATA NA MOCHILA (29/10/2026, Erling) ----------
   "sou tecnocrata e estou sem energia: precisa de uma aba extra na mochila, o Reator. Lá dentro a gente coloca os itens
   necessários para montar a bateria, um em cada encaixe; quando colocamos tudo, eles se fundem dentro do cilindro, brilham
   e viram a bateria máxima. Na aba, o desenho de um cilindro cortado onde podemos ver dentro: engrenagens e coisas steampunk."
   Os encaixes guardam o que foi posto (não se perde ao fechar). Cheios os seis, a fusão enche o reator (50.000 no Mk I). */
export interface ReactorPart { id: string; n: number; label: string }
export const REACTOR_PARTS: ReactorPart[] = [
  { id: 'casco_reator', n: 1, label: 'Casco' },
  { id: 'cristal_arcano', n: 1, label: 'Coração' },
  { id: 'engrenagem_diam', n: 1, label: 'Engrenagem-mestra' },
  { id: 'porca_perfeita', n: 2, label: 'Porcas' },
  { id: 'parafuso_inexp', n: 2, label: 'Parafusos' },
  { id: 'carvao_azul', n: 3, label: 'Combustível' },
];
const KEY = 'karmika.reactorParts.v1';
export function loadParts(): Record<string, number> { try { return JSON.parse(localStorage.getItem(KEY) || '{}') ?? {}; } catch { return {}; } }
export function saveParts(p: Record<string, number>) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* */ } }
export const partsFull = (p: Record<string, number>) => REACTOR_PARTS.every((q) => (p[q.id] ?? 0) >= q.n);

/** o cilindro cortado: casco de latão, janela de vidro, engrenagens girando, bobinas, pistões, o núcleo que brilha com a carga */
export function reactorSvg(charge: number, fusing: boolean, filled: number) {
  const k = Math.max(0, Math.min(1, charge)), glow = fusing ? 1 : 0.18 + 0.82 * k, needle = -120 + 240 * k;
  const gear = (cx: number, cy: number, r: number, teeth: number, cls: string, col: string) => { let d = ''; for (let i = 0; i < teeth; i++) { const a0 = (i / teeth) * Math.PI * 2, a1 = a0 + Math.PI / teeth * 0.55, a2 = a0 + Math.PI / teeth, a3 = a2 + Math.PI / teeth * 0.45; const P = (a: number, rr: number) => `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`; d += `${i ? 'L' : 'M'}${P(a0, r)} L${P(a1, r)} L${P(a1 + 0.02, r * 0.8)} L${P(a3, r * 0.8)} `; void a2; }
    return `<g class="${cls}" style="transform-origin:${cx}px ${cy}px"><path d="${d}Z" fill="${col}" stroke="#3a2410" stroke-width="1.2"/><circle cx="${cx}" cy="${cy}" r="${r * 0.42}" fill="#2a1a0c" stroke="${col}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${r * 0.14}" fill="${col}"/>${[0, 1, 2, 3].map((i) => { const a = i * Math.PI / 2; return `<line x1="${cx + Math.cos(a) * r * 0.16}" y1="${cy + Math.sin(a) * r * 0.16}" x2="${cx + Math.cos(a) * r * 0.4}" y2="${cy + Math.sin(a) * r * 0.4}" stroke="${col}" stroke-width="2"/>`; }).join('')}</g>`; };
  const rivets = (x: number, y0: number, y1: number) => Array.from({ length: 9 }, (_, i) => `<circle cx="${x}" cy="${y0 + (y1 - y0) * i / 8}" r="2" fill="#e8c070" stroke="#5a3a18" stroke-width=".6"/>`).join('');
  return `<svg class="rsvg ${fusing ? 'fusing' : ''}" viewBox="0 0 260 330" width="260" height="330" role="img" aria-label="O reator por dentro">
  <defs>
    <linearGradient id="rbrass" x1="0" x2="1"><stop offset="0" stop-color="#6a4218"/><stop offset=".25" stop-color="#e0a85a"/><stop offset=".5" stop-color="#b87a34"/><stop offset=".8" stop-color="#7a4a1c"/><stop offset="1" stop-color="#4a2a10"/></linearGradient>
    <linearGradient id="rinner" x1="0" x2="1"><stop offset="0" stop-color="#140c06"/><stop offset=".5" stop-color="#2a1a0c"/><stop offset="1" stop-color="#0c0804"/></linearGradient>
    <radialGradient id="rcore"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#9af0ff"/><stop offset="1" stop-color="#2a8aff" stop-opacity="0"/></radialGradient>
    <linearGradient id="rglass" x1="0" x2="1"><stop offset="0" stop-color="#bfe8ff" stop-opacity=".22"/><stop offset=".3" stop-color="#ffffff" stop-opacity=".08"/><stop offset="1" stop-color="#bfe8ff" stop-opacity=".18"/></linearGradient>
  </defs>
  <!-- tampa de cima, chaminé e manômetro -->
  <rect x="112" y="6" width="36" height="22" rx="3" fill="url(#rbrass)" stroke="#3a2410"/><rect x="106" y="2" width="48" height="8" rx="2" fill="#8a5a24" stroke="#3a2410"/>
  <g class="steam"><circle cx="122" cy="-4" r="6" fill="#d8e0e8" opacity=".35"/><circle cx="136" cy="-10" r="8" fill="#d8e0e8" opacity=".25"/></g>
  <ellipse cx="130" cy="44" rx="92" ry="20" fill="#8a5a24" stroke="#3a2410" stroke-width="1.5"/><ellipse cx="130" cy="40" rx="92" ry="20" fill="url(#rbrass)" stroke="#3a2410" stroke-width="1.5"/>
  <!-- corpo: a metade da frente foi cortada (dá para ver dentro) -->
  <path d="M38 40 V276 A92 20 0 0 0 222 276 V40 A92 20 0 0 1 38 40 Z" fill="url(#rinner)" stroke="#3a2410" stroke-width="1.5"/>
  <path d="M38 40 V276 A92 20 0 0 0 64 290 V54 A92 20 0 0 1 38 40Z" fill="url(#rbrass)" stroke="#3a2410"/><path d="M222 40 V276 A92 20 0 0 1 196 290 V54 A92 20 0 0 0 222 40Z" fill="url(#rbrass)" stroke="#3a2410"/>
  ${rivets(50, 64, 272)}${rivets(210, 64, 272)}
  <!-- bobinas de cobre enroladas nas paredes -->
  ${Array.from({ length: 14 }, (_, i) => `<path d="M70 ${74 + i * 14} q60 7 120 0" fill="none" stroke="#c86a2a" stroke-width="3" opacity=".75"/>`).join('')}
  <!-- o núcleo: coluna de vidro com a luz da carga -->
  <rect x="112" y="70" width="36" height="190" rx="14" fill="#0a1420" stroke="#8ad0ff" stroke-width="1.5"/>
  <rect class="corefill" x="116" y="${74 + 182 * (1 - k)}" width="28" height="${182 * k + (fusing ? 182 : 0)}" rx="10" fill="#5ae0ff" opacity="${0.5 + 0.5 * k}"/>
  <ellipse class="coreglow" cx="130" cy="165" rx="70" ry="110" fill="url(#rcore)" opacity="${glow.toFixed(2)}"/>
  ${Array.from({ length: 6 }, (_, i) => `<line class="arc a${i}" x1="130" y1="${90 + i * 30}" x2="${i % 2 ? 160 : 100}" y2="${100 + i * 30}" stroke="#dff8ff" stroke-width="1.5" opacity="${fusing ? 1 : 0.35 * k}"/>`).join('')}
  <!-- engrenagens -->
  ${gear(86, 110, 26, 12, 'g1', '#d8a050')}${gear(176, 140, 20, 10, 'g2', '#b88a40')}${gear(84, 214, 18, 9, 'g3', '#c8963c')}${gear(180, 232, 26, 12, 'g1', '#d8a050')}
  <!-- pistões -->
  <g class="piston"><rect x="150" y="186" width="44" height="10" fill="#8a8e98" stroke="#2a2a30"/><rect x="190" y="182" width="10" height="18" fill="#5a5e68"/></g>
  <g class="piston p2"><rect x="66" y="152" width="44" height="10" fill="#8a8e98" stroke="#2a2a30"/><rect x="60" y="148" width="10" height="18" fill="#5a5e68"/></g>
  <!-- vidro da janela e reflexo -->
  <path d="M64 54 V290 A92 20 0 0 0 196 290 V54 A92 20 0 0 1 64 54Z" fill="url(#rglass)"/>
  <!-- base -->
  <ellipse cx="130" cy="280" rx="96" ry="21" fill="#5a3a18" stroke="#3a2410"/><rect x="34" y="280" width="192" height="16" fill="url(#rbrass)" stroke="#3a2410"/><ellipse cx="130" cy="296" rx="96" ry="21" fill="#4a2a10" stroke="#3a2410"/>
  <!-- manômetro de carga -->
  <g transform="translate(232 70)"><circle r="22" fill="#f0e0c0" stroke="#8a5a24" stroke-width="4"/>${Array.from({ length: 9 }, (_, i) => { const a = (-120 + i * 30) * Math.PI / 180; return `<line x1="${Math.sin(a) * 15}" y1="${-Math.cos(a) * 15}" x2="${Math.sin(a) * 19}" y2="${-Math.cos(a) * 19}" stroke="#3a2410" stroke-width="1.5"/>`; }).join('')}<line class="needle" x1="0" y1="0" x2="0" y2="-16" stroke="#b8302a" stroke-width="2.5" style="transform:rotate(${needle}deg)"/><circle r="3" fill="#3a2410"/></g>
  <text x="130" y="322" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="#e8d8b0">${fusing ? 'fundindo…' : `${filled}/6 encaixes · carga ${Math.round(k * 100)}%`}</text>
</svg>`;
}
