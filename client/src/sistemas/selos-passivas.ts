/* SELOS DAS PASSIVAS NAS MAGIAS (05/11, Erling: "quando coloco uma passiva de habilidade os brasões aparecem pequenos do lado da magia,
   mostrando a somatória do bônus — na árvore e no menu de magias"). Cada passiva acesa que mira uma magia vira um selinho (o desenho dela)
   no canto do ícone; a dica soma o que todas dão juntas. Quem sabe o kit e as passivas registra o provedor (arvore-classe.ts). */
export interface Selo { ico: string; name: string; rank: number; max: number }
let prov: ((skillId: string) => { selos: Selo[]; soma: string }) | null = null;
export function setSeloProvider(f: typeof prov) { prov = f; }
const esc = (t: string) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
/** os selinhos de uma magia (vazio se nenhuma passiva acesa mira nela) */
export function selosHtml(skillId: string): string {
  const r = prov?.(skillId); if (!r || !r.selos.length) return '';
  const tip = `${r.selos.map((s) => `${s.name} ${s.rank}/${s.max}`).join(' · ')}${r.soma ? ` — juntas: ${r.soma}` : ''}`;
  return `<span class="pvsel" title="${esc(tip)}">${r.selos.slice(0, 3).map((s) => `<i class="${s.rank >= s.max ? 'max' : ''}">${s.ico}</i>`).join('')}</span>`;
}
/** só o texto da soma (para dicas) */
export function selosSoma(skillId: string): string { const r = prov?.(skillId); return r && r.selos.length ? `Passivas: ${r.selos.map((s) => `${s.name} ${s.rank}/${s.max}`).join(', ')}${r.soma ? ` (${r.soma})` : ''}` : ''; }
