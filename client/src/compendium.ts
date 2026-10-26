/** Compêndio do Karma: toda decisão marcante fica registrada para sempre (o que foi feito, onde, quando, o peso). */
import { floatWin } from './windows';

export interface KEntry { title: string; what: string; delta: number; where: string; day: number; lvl: number; at: number; sealed?: boolean }
const KEY = 'karmika.compendium.v1';
export function createCompendium(ctx: { where(): string; day(): number; lvl(): number }) {
  let list: KEntry[] = []; try { list = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { list = []; }
  const el = document.createElement('div'); el.id = 'compw'; el.className = 'modalw'; document.body.appendChild(el);
  floatWin(el, 'comp', { left: '28vw', top: '8vh' });
  let open = false;
  function render() {
    if (!open) { el.style.display = 'none'; return; }
    const vis = list.filter((e) => !e.sealed), sum = vis.reduce((a, e) => a + e.delta, 0), light = vis.filter((e) => e.delta > 0).reduce((a, e) => a + e.delta, 0), dark = vis.filter((e) => e.delta < 0).reduce((a, e) => a + e.delta, 0), nSeal = list.length - vis.length;
    el.innerHTML = `<div class="pn comppn"><h2>Compêndio do Karma <button data-al title="Alinhamento Kármico com vilas, regiões e facções">🏘 Alinhamento</button><button data-x>✕</button></h2>
      <p class="creed">Marghar não julga. Ele vê, e guarda. Mas ele cobra… Ele se lembra.</p>
      <div class="ksum"><span style="color:#9ad7ff">Luz +${light}</span><span style="color:#ff8a7a">Sombra ${dark}</span><span>Peso total ${sum > 0 ? '+' : ''}${sum}</span><span>${list.length} decisões</span>${nSeal ? `<span style="color:#8a7aa0">🌑 ${nSeal} guardada${nSeal > 1 ? 's' : ''} em silêncio</span>` : ''}</div>
      <div class="klist">${list.length ? [...list].reverse().map((e) => `<div class="ke ${e.sealed ? 's' : e.delta > 0 ? 'l' : e.delta < 0 ? 'd' : ''}"><div class="kh"><b>${e.title}</b><i>${e.sealed ? '🌑 ?' : `${e.delta > 0 ? '+' : ''}${e.delta}`}</i></div><p>${e.what}</p><small>${e.where} · dia ${e.day} · nível ${e.lvl}</small></div>`).join('') : '<em>Nenhuma decisão ainda. Toda escolha que pesa ficará escrita aqui, para sempre.</em>'}</div></div>`;
    el.style.display = 'flex';
  }
  el.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('[data-al]')) { dispatchEvent(new Event('karmika:align')); return; } if ((e.target as HTMLElement).closest('[data-x]')) { open = false; render(); } });
  return {
    /** o Olho abriu: as escolhas guardadas em silêncio são reveladas e cobradas */
    unseal() { const out = list.filter((e) => e.sealed).map((e) => ({ title: e.title, delta: e.delta })); for (const e of list) e.sealed = false; try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* */ } if (open) render(); return out; },
    sealedCount: () => list.filter((e) => e.sealed).length,
    add(e: { title: string; what: string; delta: number; sealed?: boolean }) { list.push({ ...e, where: ctx.where(), day: ctx.day(), lvl: ctx.lvl(), at: Date.now() }); try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* */ } if (open) render(); },
    toggle() { open = !open; render(); }, get isOpen() { return open; }, close() { open = false; render(); }, list: () => list,
  };
}
