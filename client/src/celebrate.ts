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

/** 03/11 (Erling: "quando usarmos o item premium precisa ter uma comemoração do personagem, uma dancinha, um brilho legal e uma mensagem de
 *  boas-vindas, reiterando que é apenas melhoria de vida e não existe pay to win em Karmika"): o cartão no meio da tela. A dança e o brilho
 *  em volta do herói ficam no main (quem chama). */
export function premiumWelcome(days: number, total: number) {
  const st = document.createElement('style'); st.textContent = `
  .pmw{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 45%,rgba(120,60,200,.28),rgba(0,0,0,.55) 70%);animation:pmwIn .5s ease-out}
  .pmw .card{position:relative;width:min(560px,92vw);padding:28px 30px 22px;border-radius:16px;background:linear-gradient(160deg,#1c1230,#120c1c 60%,#1a1206);border:1px solid #c9a0ff;box-shadow:0 0 0 1px #5a3a8a inset,0 0 60px rgba(201,160,255,.45),0 20px 60px rgba(0,0,0,.6);color:#eadcff;font-family:Georgia,serif;text-align:center;animation:pmwPop .7s cubic-bezier(.2,1.6,.4,1)}
  .pmw .seal{font-size:46px;line-height:1;filter:drop-shadow(0 0 12px #c9a0ff);animation:pmwSpin 3s linear infinite}
  .pmw small{display:block;letter-spacing:.3em;font-size:11px;color:#c9a0ff;margin:10px 0 4px}
  .pmw h1{margin:0 0 12px;font-size:28px;color:#ffe9a8;text-shadow:0 0 18px rgba(255,210,120,.55)}
  .pmw p{margin:0 0 10px;font-size:14px;line-height:1.55;color:#e0d2f4}
  .pmw ul{list-style:none;padding:0;margin:6px 0 12px;font-size:13px;color:#d8c8ff;line-height:1.7}
  .pmw .joke{font-style:italic;color:#ffd27a}
  .pmw .days{font-size:12px;color:#a08ac8;margin-top:6px}
  .pmw button{margin-top:12px;background:linear-gradient(#5a3a8a,#3a2260);border:1px solid #c9a0ff;color:#fff4d8;border-radius:8px;padding:9px 22px;font-size:14px;cursor:pointer;font-family:inherit}
  .pmw button:hover{filter:brightness(1.2)}
  .pmw .spark{position:absolute;width:6px;height:6px;border-radius:50%;background:#ffe9a8;box-shadow:0 0 10px #ffd24a;animation:pmwSpark 2.4s ease-in-out infinite}
  @keyframes pmwIn{from{opacity:0}to{opacity:1}} @keyframes pmwPop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
  @keyframes pmwSpin{0%{transform:rotate(0) scale(1)}50%{transform:rotate(180deg) scale(1.12)}100%{transform:rotate(360deg) scale(1)}}
  @keyframes pmwSpark{0%,100%{opacity:0;transform:translateY(0) scale(.4)}50%{opacity:1;transform:translateY(-18px) scale(1)}}`;
  const w = document.createElement('div'); w.className = 'pmw';
  const sparks = Array.from({ length: 14 }, (_, i) => `<i class="spark" style="left:${6 + (i * 37) % 88}%;top:${8 + (i * 53) % 80}%;animation-delay:${(i * 0.17).toFixed(2)}s"></i>`).join('');
  w.innerHTML = `<div class="card">${sparks}<div class="seal">✦</div><small>O SELO DE MARGHAR FOI ROMPIDO</small><h1>Bem-vindo ao Premium!</h1>
    <p>Marghar abriu os olhos e sorriu para você. A partir de agora a sua jornada em Karmika fica mais confortável:</p>
    <ul><li>✦ mais espaço, mais atalhos e menos espera</li><li>✦ visuais e brasões para mostrar quem você é</li><li>✦ pequenas gentilezas do caminho</li></ul>
    <p><b>Mas nada disso compra poder.</b> Em Karmika não existe pay to win: nenhuma espada, nenhum nível e nenhuma vitória se vende. O que você vale aqui continua sendo o que você escolhe, o que você enfrenta e o karma que carrega.</p>
    <p class="joke">Afinal, o Premium deixa a viagem mais macia — mas as más escolhas você continua pagando sozinho, nesta vida e na próxima. 😉</p>
    <div class="days">+${days} dias · ${total} dias de Premium no total</div><button>Que o Olho me guie</button></div>`;
  document.head.appendChild(st); document.body.appendChild(w);
  const close = () => { w.style.transition = 'opacity .4s'; w.style.opacity = '0'; setTimeout(() => { w.remove(); st.remove(); }, 420); };
  w.querySelector('button')!.addEventListener('click', close); w.addEventListener('click', (e) => { if (e.target === w) close(); });
}
