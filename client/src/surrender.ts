/** Rendição de elites e chefes: o inimigo derrotado fala, e O QUE ele oferece muda o peso da escolha.
 *  Regra: o desfecho do mundo pode ser o mesmo (a vila é salva de qualquer jeito); o que muda é o KARMA de quem escolheu.
 *  - Suborno: poupar por tesouro é vender a própria nobreza → karma negativo na hora (ganha o tesouro).
 *  - Arrependimento: poupar é fé no outro → karma positivo se era verdade; se era mentira, a ingenuidade pesa e ele ataca.
 *  - Ameaça: poupar por medo é covardia → karma negativo; matar enfrenta a maldição.
 *  Depois da escolha, o Olho explica o julgamento numa janela. */
import { bringFront } from './windows';

export type Plea = 'bribe' | 'repent' | 'threat';
export interface SurrenderCtx {
  name: string; level: number; demonic: boolean;
  karma(delta: number): void; log(t: string, c?: string): void;
  treasure(): void; xp(frac: number): void; tome(): void; hurt(frac: number): void; kill(): void; spare(): void;
  /** grava a decisão no Compêndio do Karma (para sempre) */
  record(e: { title: string; what: string; delta: number; sealed?: boolean }): void;
  /** ele fugiu: abre a missão de busca e captura */
  fled(): void;
  /** antes do nível 20 o Olho dorme: nada de julgamento na tela; a escolha fica guardada e é cobrada quando ele abrir */
  sealed?: boolean;
}
const GOD = 'Marghar, o dos Caminhos';
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** falas por tipo de criatura (demônio / besta / morto-vivo) e por súplica */
function lines(c: SurrenderCtx, plea: Plea): string[] {
  const open = c.demonic
    ? ['*Gasp... gasp...* Herói maldito... você conseguiu. Quem diria... você conseguiu.', 'Mas não é o fim. Você sabe... nunca é.']
    : ['*Arfando, de joelhos, o sangue escorrendo pela boca*', 'Chega... chega. Você venceu.'];
  if (plea === 'bribe') return [...open, pick([
    'Eu posso lhe dar tesouros inimagináveis... ouro dos que eu devorei, armas que nenhum ferreiro vivo saberia forjar. Basta me poupar.',
    'Poupe minha vida e o cofre que guardo há três séculos é seu. Ninguém precisa saber. Ninguém nunca sabe.',
  ])];
  if (plea === 'repent') return [...open, pick([
    `Eu me rendo, eu me rendo, herói! Juro dedicar o que me resta a salvar as vilas que eu mesmo envenenei. Renuncio a todo mal que há em mim... ajude-me a trilhar o caminho de ${GOD}.`,
    `Eu me lembro de quem eu era antes da sombra... Deixe-me viver e eu reconstruo o que destruí, pedra por pedra, em nome de ${GOD}.`,
  ])];
  return [...open, pick([
    'Mate-me, e minha maldição cairá sobre você e sobre o seu sangue por sete vidas.',
    'Erga essa lâmina e Orrukh, o Devorador de Cinzas, saberá o seu nome. Ele come as dívidas — e você acaba de contrair uma.',
  ])];
}

function modal(title: string, html: string, buttons: [string, () => void][], cls = '') {
  const d = document.createElement('div'); d.className = `kconf kchoice ${cls}`;
  d.innerHTML = `<div class="pn"><h2>${title}</h2>${html}<div class="row">${buttons.map((b, i) => `<button data-i="${i}">${b[0]}</button>`).join('')}</div></div>`;
  document.body.appendChild(d); bringFront(d);
  d.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('[data-i]') as HTMLElement | null; if (!b) return; d.remove(); buttons[+b.dataset.i!][1](); });
}
/** o Olho sai do brasão, sobe até o meio da tela e VÊ; depois, o que você fez e o resultado kármico.
 *  Um Olho só: se outras escolhas chegam enquanto ele está aberto (vários elites, missão com muitos atos), entram na mesma visão
 *  e o karma aparece somado, em vez de o Olho subir cinco vezes seguidas. */
let openEye: { list: HTMLElement; kd: HTMLElement; total: number; n: number; jt: HTMLElement; afters: (() => void)[] } | null = null;
export function eyeSees(title: string, what: string, why: string, delta: number, after?: () => void) {
  if (openEye) { const o = openEye; o.n++; o.total += delta; if (after) o.afters.push(after);
    const it = document.createElement('div'); it.className = 'eyeitem'; const c = delta > 0 ? '#9ad7ff' : delta < 0 ? '#ff8a7a' : '#d9c08a';
    it.innerHTML = `<b>${title}</b> <span style="color:${c}">${delta > 0 ? '+' : ''}${delta}</span><br><small>${what}</small>`; o.list.appendChild(it);
    o.jt.textContent = `O Olho viu ${o.n} atos seus.`; o.kd.textContent = `Karma ${o.total > 0 ? '+' : ''}${o.total}`; o.kd.style.color = o.total > 0 ? '#9ad7ff' : o.total < 0 ? '#ff8a7a' : '#d9c08a';
    o.kd.animate([{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], 350); return; }
  const src = document.getElementById('eye'); const r = src?.getBoundingClientRect();
  const wrap = document.createElement('div'); wrap.className = 'eyesee'; document.body.appendChild(wrap); bringFront(wrap);
  const eye = document.createElement('div'); eye.className = 'eyefly'; eye.innerHTML = src ? src.outerHTML.replace('id="eye"', '') : '👁'; wrap.appendChild(eye);
  const w0 = r?.width || 120, h0 = r?.height || 74; Object.assign(eye.style, { left: (r?.left ?? innerWidth / 2 - 60) + 'px', top: (r?.top ?? 20) + 'px', width: w0 + 'px', height: h0 + 'px' });
  if (src) src.style.visibility = 'hidden';
  const W = Math.min(340, innerWidth * 0.4), H = W * h0 / w0;
  requestAnimationFrame(() => requestAnimationFrame(() => { wrap.classList.add('on'); Object.assign(eye.style, { left: (innerWidth - W) / 2 + 'px', top: innerHeight * 0.12 + 'px', width: W + 'px', height: H + 'px' }); }));
  const col = delta > 0 ? '#9ad7ff' : delta < 0 ? '#ff8a7a' : '#d9c08a';
  const panel = document.createElement('div'); panel.className = 'eyetext';
  panel.innerHTML = `<p class="creed">Marghar não julga. Ele vê, e guarda.<br>Mas ele cobra… Ele se lembra.</p><p class="jt">${title}</p><div class="eyelist"><div class="eyeitem first"><p>${what}</p><p class="why">${why}</p></div></div><p class="kd" style="color:${col}">Karma ${delta > 0 ? '+' : ''}${delta}</p><small class="cmp">✦ Registrado para sempre no seu Compêndio do Karma (U)</small><div class="row"><button>Seguir o caminho</button></div>`;
  panel.style.top = innerHeight * 0.12 + H + 14 + 'px'; wrap.appendChild(panel);
  const o = { list: panel.querySelector('.eyelist') as HTMLElement, kd: panel.querySelector('.kd') as HTMLElement, jt: panel.querySelector('.jt') as HTMLElement, total: delta, n: 1, afters: after ? [after] : [] }; openEye = o;
  /* quando chega o segundo ato, o primeiro vira linha da lista também */
  const first = o.list.querySelector('.first') as HTMLElement; const origAppend = o.list.appendChild.bind(o.list);
  o.list.appendChild = (<T extends Node>(nd: T): T => { if (first.dataset.compact !== '1') { first.dataset.compact = '1'; first.innerHTML = `<b>${title}</b> <span style="color:${col}">${delta > 0 ? '+' : ''}${delta}</span><br><small>${what}</small>`; } return origAppend(nd); }) as typeof o.list.appendChild;
  setTimeout(() => panel.classList.add('on'), 1300);
  panel.querySelector('button')!.addEventListener('click', () => {
    if (openEye === o) openEye = null;
    panel.classList.remove('on'); if (r) Object.assign(eye.style, { left: r.left + 'px', top: r.top + 'px', width: w0 + 'px', height: h0 + 'px' }); wrap.classList.remove('on');
    setTimeout(() => { wrap.remove(); if (src) src.style.visibility = ''; for (const f of o.afters) f(); }, 1100);
  });
}

export function surrender(c: SurrenderCtx) {
  const judge = (title: string, what: string, why: string, delta: number) => {
    if (c.sealed) { c.record({ title: `${c.name}: ${title}`, what, delta, sealed: true } as never); c.log('🌑 Em algum lugar, algo que ainda dorme guardou o que você fez.', '#a898c8'); return; }
    c.record({ title: `${c.name}: ${title}`, what, delta }); eyeSees(title, what, why, delta); };
  const karma0 = c.karma; c.karma = (d) => { if (!c.sealed) karma0(d); }; // selado: o peso só cai quando o Olho abrir
  const plea: Plea = Math.random() < 0.4 ? 'bribe' : Math.random() < 0.65 ? 'repent' : 'threat';
  const ls = lines(c, plea);
  const html = `<div class="plea">${ls.map((l) => `<p><i>${l.startsWith('*') ? l : `“${l}”`}</i></p>`).join('')}</div><small class="hint">A escolha é sua. Toda escolha é válida — e toda escolha pesa.</small>`;
  const spareLabel = plea === 'bribe' ? '💰 Poupar e aceitar o tesouro' : plea === 'repent' ? '🕊 Poupar e acreditar nele' : '🏳 Poupar (temer a maldição)';
  const killLabel = c.demonic ? '⚔ Expurgá-lo' : '⚔ Acabar com ele';
  modal(`${c.name} se rende`, html, [
    [killLabel, () => {
      c.kill();
      if (plea === 'bribe') { c.karma(8); judge('Você recusou o suborno.', `${c.name} ofereceu riquezas pela própria vida, e você cumpriu o seu papel.`, 'Quem não se vende fortalece a própria alma. O espólio de sempre é seu, sem dívida com ninguém.', 8); }
      else if (plea === 'repent') { c.karma(3); judge('Você não deu a segunda chance.', `${c.name} jurou se arrepender. Você nunca saberá se dizia a verdade.`, 'Cumprir o dever é justo, mas fechar a porta para a redenção também pesa. A vila será salva — o Olho apenas anota que você escolheu a lâmina.', 3); }
      else { c.karma(6); c.log('🩸 A maldição sussurra no seu sangue... (por ora, só sussurra)', '#c08aff'); judge('Você enfrentou a ameaça.', `${c.name} prometeu uma maldição por sete vidas e mesmo assim você não recuou.`, 'Coragem diante do medo é karma claro. Mas maldições são reais em Karmika: elas podem voltar em outra encarnação.', 6); }
    }],
    [spareLabel, () => {
      c.spare();
      if (plea === 'bribe') { c.treasure(); c.karma(-12); judge('Você vendeu a sua nobreza.', `Poupou ${c.name} não por piedade, mas por ganância: ele comprou a sua lâmina com tesouros e riquezas.`, `É uma escolha válida, tão válida quanto matá-lo — mas um demônio que deveria ser expurgado segue livre, e você deixou de cumprir o seu papel em troca de ouro. Isso pesa no seu KARMA.`, -12); }
      else if (plea === 'repent') {
        if (Math.random() < 0.5) { c.karma(15); c.xp(0.4); judge('Ele dizia a verdade.', `${c.name} se ajoelha diante de ${GOD} e parte para as vilas que envenenou. Com o tempo, o trigo volta a crescer.`, 'Você viu uma alma onde os outros viam só um monstro. Misericórdia que salva é o karma mais claro que existe.', 15); }
        else { c.hurt(0.3); c.karma(-6); c.fled(); judge('Era mentira.', `Assim que você virou as costas, ${c.name} cravou uma lâmina escondida e fugiu para as sombras.`, 'A vila será salva de qualquer forma — mas acreditar num demônio é uma fragilidade, e Marghar cobra a ingenuidade de quem se deixa enganar. Ele ainda está por aí: uma caçada foi aberta no seu diário.', -6); }
      }
      else { c.tome(); c.karma(-5); judge('Você poupou por medo.', `A ameaça de ${c.name} venceu a sua lâmina. Ele deixa um tomo antigo e desaparece.`, 'Poupar por temor não é piedade, é covardia. O tomo é seu, mas o Olho viu o que moveu a sua mão.', -5); }
    }],
  ]);
}
