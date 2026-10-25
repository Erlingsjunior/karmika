/* Comemorações na tela, em três pesos:
   - nível geral: o grande (já existe em gameplay.ts);
   - nível de classe: médio, violeta e dourado, no alto da tela;
   - nível de profissão: discreto, um selo embaixo do centro;
   - poção: um pulso rápido de cor nas bordas da tela (vermelho = vida, azul = magia, âmbar = tônico). */

export function classLevelUp(name: string, lvl: number) {
  const b = document.createElement('div'); b.className = 'clsup';
  b.innerHTML = `<small>NÍVEL DE CLASSE</small><b>${name} <em>${lvl}</em></b><i></i>`;
  document.body.appendChild(b);
  const f = document.createElement('div'); f.className = 'clsflash'; document.body.appendChild(f);
  setTimeout(() => { b.remove(); f.remove(); }, 3000);
}

let profQ: HTMLElement[] = [];
export function profLevelUp(icon: string, name: string, lvl: number) { badge(icon, name, `nível ${lvl}`); }
/** selo discreto embaixo do centro (profissão, alguém chegou ao mundo…) */
export function badge(icon: string, top: string, main: string, kind = '') {
  const b = document.createElement('div'); b.className = 'profup ' + kind;
  const e = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
  b.innerHTML = `<i>${icon}</i><div><small>${e(top)}</small><b>${e(main)}</b></div>`;
  b.style.bottom = `${250 + profQ.length * 54}px`; profQ.push(b);
  document.body.appendChild(b);
  setTimeout(() => { b.remove(); profQ = profQ.filter((x) => x !== b); }, 2600);
}

export function potionPulse(kind: 'hp' | 'mp' | 'buff') {
  const f = document.createElement('div'); f.className = `potfx ${kind}`; document.body.appendChild(f);
  dispatchEvent(new CustomEvent('karmika:drink', { detail: kind })); // o jogo solta a aura em volta do herói
  setTimeout(() => f.remove(), 900);
}
