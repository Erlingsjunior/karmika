/* KARMIKA, landing, rodada de 10/11: menu do celular, luta com os dados na lateral, maravilhas, artbook que se folheia,
   a Bíblia deitada na mesa (ler ou baixar), o olho verde-amarelo que se fecha e o botão de embaixador. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---- as runas de Karmika ao fundo: malha quase invisível; de tempos em tempos uma acende em ouro ou no azul da pedra do teleporte ---- */
  const RUNAS = ['M14 3 C17 9 21 13.5 21 18 A7 7 0 0 1 7 18 C7 13.5 11 9 14 3Z', 'M4 4 V24 M24 4 V24 M12 4 L6.5 14 L12 24 M16 4 L21.5 14 L16 24 M8.5 14 Q14 9 19.5 14 Q14 19 8.5 14Z', 'M7 4 H21 L14 14 L21 24 H7 L14 14 Z', 'M5 24 V4 H23 V23.5 H8.5 V7.5 H19.5 V20 H12 V11 H16 V16.5', 'M11.5 7.2 A8.3 8.3 0 1 0 16.5 7.2 M11.5 7.2 C11 5.4 9.8 4.2 8.2 3.6 M16.5 7.2 C17 5.4 18.2 4.2 19.8 3.6', 'M11.4 2.6 V18.8 M16.6 9.2 V25.4 M6.6 10.4 C9.2 10.4 11.4 11.8 12.8 14 C14.2 16.2 16.4 17.6 21.4 17.6'];
  const rl = document.createElement('div'); rl.className = 'runes'; rl.setAttribute('aria-hidden', 'true'); document.body.prepend(rl);
  const buildRunes = () => { const cell = innerWidth < 600 ? 64 : 92, cols = Math.ceil(innerWidth / cell) + 1, rows = Math.ceil(innerHeight / cell) + 1; let h = '';
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const r = RUNAS[(x * 7 + y * 3 + ((x * y) % 5)) % 6]; h += `<svg viewBox="0 0 28 28" style="left:${x * cell + (y % 2 ? cell / 2 : 0) - cell / 2}px;top:${y * cell - cell / 2}px;width:${cell * 0.34}px"><path d="${r}"/></svg>`; }
    rl.innerHTML = h; };
  buildRunes(); let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(buildRunes, 250); });
  if (!reduce) setInterval(() => { if (document.hidden) return; const all = rl.children; if (!all.length) return; let el = null; for (let k = 0; k < 12 && !el; k++) { const c = all[Math.floor(Math.random() * all.length)]; const x = parseFloat(c.style.left) / innerWidth; if (x < 0.13 || x > 0.85) el = c; } if (!el) return; const c = Math.random() < 0.6 ? 'g' : 'b'; el.classList.add(c); setTimeout(() => el.classList.remove(c), 2600); }, 700);

  /* ---- menu do celular ---- */
  const burger = $('.nav__burger'), links = $('#navLinks');
  if (burger && links) {
    const set = (on) => { document.body.classList.toggle('nav-open', on); burger.setAttribute('aria-expanded', on ? 'true' : 'false'); };
    burger.addEventListener('click', () => set(!document.body.classList.contains('nav-open')));
    links.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  }

  /* ---- a luta: as imagens trocam e os dados rolam na lateral ---- */
  const fight = $('#fight');
  if (fight) {
    const imgs = [...fight.querySelectorAll('.fight__img')], list = $('.fight__rolls', fight), hit = $('.fight__hit', fight);
    const d = (n) => 1 + Math.floor(Math.random() * n);
    const foes = [['Chefe Rubro', 15], ['Lobo Gélido', 13], ['Carniçal', 12], ['Elite da Cripta', 17], ['Javali Velho', 11]];
    let foe = foes[0], step = 0, img = 0, timer = 0;
    const push = (html, cls = '') => { const li = document.createElement('li'); li.className = cls; li.innerHTML = html; list.prepend(li); while (list.children.length > 7) list.lastElementChild.remove(); requestAnimationFrame(() => li.classList.add('in')); };
    const turn = () => {
      if (step % 5 === 0) { foe = foes[Math.floor(Math.random() * foes.length)]; img = (img + 1) % imgs.length; imgs.forEach((im, i) => im.classList.toggle('on', i === img)); push(`<em>⚔ contra ${foe[0]}</em> <small>CD ${foe[1]}</small>`, 'head'); }
      step++;
      const r = d(20), acc = 9, tot = r + acc;
      if (r === 1) { push(`<b>d20</b> <span class="dv">1</span> <i>erro crítico</i>, você fica aberto`, 'miss'); return; }
      if (tot < foe[1]) { push(`<b>d20</b> <span class="dv">${r}</span> + ${acc} = ${tot} <i>errou</i>`, 'miss'); return; }
      const crit = r >= 19, a = d(4), b = d(4), c = d(8), arma = 7, dmg = Math.round((a + b + c + arma) * (crit ? 1.7 : 1));
      push(`<b>d20</b> <span class="dv">${r}</span> + ${acc} = ${tot} <i>${crit ? 'CRÍTICO!' : 'acertou'}</i>`, crit ? 'crit' : 'ok');
      push(`<b>dano</b> 2d4+1d8+${arma} = <span class="dv">${a}+${b}+${c}+${arma}</span>${crit ? ' ×1,7' : ''} → <strong>${dmg}</strong>`, 'dmg');
      if (hit && !reduce) { hit.textContent = crit ? `${dmg}!` : dmg; hit.className = 'fight__hit' + (crit ? ' crit' : ''); hit.style.left = 35 + Math.random() * 30 + '%'; hit.style.top = 30 + Math.random() * 25 + '%'; void hit.offsetWidth; hit.classList.add('go'); }
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => { clearInterval(timer); if (e.isIntersecting) { turn(); timer = setInterval(turn, reduce ? 4000 : 1700); } }), { threshold: 0.2 });
    io.observe(fight);
  }

  /* ---- maravilhas: palco grande + miniaturas, troca com setas, toque e teclado ---- */
  const W = window.KARMIKA_WONDERS || [];
  const view = $('#wondersView'), thumbs = $('#wondersThumbs');
  if (view && thumbs && W.length) {
    const stage = $('.wonders__stage', view);
    stage.innerHTML = W.map((w, i) => `<button type="button" class="wn${i ? '' : ' on'}" data-lb="/img/${w.img}.webp" data-cap="${esc(w.nome)}, ${esc(w.lugar)}"><img src="/img/${w.img}.webp" alt="${esc(w.nome)}" loading="${i < 2 ? 'eager' : 'lazy'}"></button>`).join('');
    thumbs.innerHTML = W.map((w, i) => `<button type="button" role="tab" aria-selected="${i ? 'false' : 'true'}" data-w="${i}"><img src="/img/${w.img}.webp" alt="" loading="lazy"><span>${esc(w.nome)}</span></button>`).join('');
    let cur = 0, auto = 0;
    const go = (i, user) => { cur = (i + W.length) % W.length; const w = W[cur];
      stage.querySelectorAll('.wn').forEach((b, j) => b.classList.toggle('on', j === cur));
      thumbs.querySelectorAll('button').forEach((b, j) => { b.setAttribute('aria-selected', j === cur ? 'true' : 'false'); });
      const t = thumbs.children[cur]; if (t && user) t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      $('.wonders__k', view).textContent = w.lugar; $('.wonders__n', view).textContent = w.nome; $('.wonders__d', view).textContent = w.txt;
      if (window.gsap && !reduce) gsap.fromTo($('.wonders__txt', view), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 });
      if (user) { clearInterval(auto); auto = setInterval(() => go(cur + 1), 7000); } };
    thumbs.addEventListener('click', (e) => { const b = e.target.closest('[data-w]'); if (b) go(+b.dataset.w, true); });
    $('.wonders__arw--p', view).addEventListener('click', () => go(cur - 1, true)); $('.wonders__arw--n', view).addEventListener('click', () => go(cur + 1, true));
    let sx = 0; view.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    view.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1), true); });
    go(0); const io = new IntersectionObserver((es) => es.forEach((e) => { clearInterval(auto); if (e.isIntersecting && !reduce) auto = setInterval(() => go(cur + 1), 7000); }), { threshold: 0.3 }); io.observe(view);
  }

  /* ---- artbook: um livro que se abre e vira as páginas (no celular, uma página por vez) ---- */
  const AB = window.KARMIKA_ARTBOOK || [];
  const ab = $('#abook');
  if (ab && AB.length) {
    const book = $('.abook__book', ab), n = $('.abook__n', ab);
    const page = (p) => p && p[0] === '#' ? `<div class="abp abp--title"><img src="/img/logo-bronze.webp" alt=""><b>${esc(p[1])}</b><span class="cv__line"></span></div>` : p ? `<button type="button" class="abp" data-lb="/img/${p[0]}.webp" data-cap="${esc(p[1])}"><img src="/img/${p[0]}.webp" alt="${esc(p[1])}" loading="lazy"><span>${esc(p[1])}</span></button>` : '<div class="abp abp--end"><img src="/img/logo-bronze.webp" alt=""><span>continua no artbook impresso</span></div>';
    /* 10/11 (Erling): capa dura de couro, com moldura em relevo, cantoneiras de metal e as runas de Karmika em volta */
    const rr = (k, x, y, sz) => `<svg class="cv__r" viewBox="0 0 28 28" style="left:${x}%;top:${y}%;width:${sz}%"><path d="${RUNAS[k % 6]}"/></svg>`;
    let runes = ''; for (let i = 0; i < 7; i++) { const t = 10 + i * 13.3; runes += rr(i, t, 3.2, 5.2) + rr(i + 3, t, 91.8, 5.2); } for (let i = 0; i < 9; i++) { const t = 11 + i * 9.6; runes += rr(i + 1, 3.6, t, 5.2) + rr(i + 4, 91.2, t, 5.2); }
    const corner = (c) => `<i class="cv__c cv__c--${c}"><svg viewBox="0 0 40 40"><path d="M2 2 H30 Q22 8 20 20 Q8 22 2 30 Z"/><circle cx="9" cy="9" r="3"/></svg></i>`;
    const cover = `<div class="abp abp--cover"><span class="cv__f"></span><span class="cv__f2"></span>${runes}${['tl', 'tr', 'bl', 'br'].map(corner).join('')}<img src="/img/logo-brasa.webp" alt=""><b>KARMIKA</b><i>Artbook · Volume I</i><span class="cv__line"></span><small>D2 Studio</small></div>`;
    /* 10/11: a página de título de cada parte abre sempre à esquerda, com a primeira imagem à direita; se cair à direita, entra uma página em branco antes */
    const pages = [cover]; for (const p of AB) { if (p[0] === '#' && pages.length % 2 === 0) pages.push('<div class="abp abp--blank"></div>'); pages.push(page(p)); } if (pages.length % 2) pages.push(page(null));
    /* folhas: cada folha tem frente (página da direita) e verso (a da esquerda da próxima abertura) */
    const leaves = []; for (let i = 0; i < pages.length; i += 2) leaves.push([pages[i], pages[i + 1]]);
    book.innerHTML = '<div class="abook__base"></div>' + leaves.map((l, i) => `<div class="leaf" style="--z:${leaves.length - i}"><div class="leaf__f">${l[0]}</div><div class="leaf__b">${l[1]}</div></div>`).join('');
    const L = [...book.querySelectorAll('.leaf')]; let at = 0;
    const narrow = () => matchMedia('(max-width: 760px)').matches;
    const render = () => { L.forEach((lf, i) => { const turned = i < at; lf.classList.toggle('turned', turned); lf.style.zIndex = turned ? 100 + i : leaves.length - i; });
      book.classList.toggle('is-open', at > 0); book.classList.toggle('is-end', at === L.length);
      n.textContent = at === 0 ? 'capa' : at === L.length ? 'fim' : `${at * 2 - 1}–${at * 2} de ${pages.length - 1}`;
      ab.querySelector('[data-ab="-1"]').disabled = at === 0; const nx = ab.querySelector('[data-ab="1"]'); nx.disabled = false; nx.classList.toggle('is-restart', at === L.length); nx.textContent = at === L.length ? '↺' : '›'; nx.setAttribute('aria-label', at === L.length ? 'Voltar ao começo' : 'Próxima página'); nx.title = at === L.length ? 'Voltar ao começo' : ''; };
    /* a folha que está virando fica por cima de todas até terminar (na volta ela sumia atrás das outras) */
    const flip = (dir) => { const nx = Math.max(0, Math.min(L.length, at + dir)); if (nx === at) return; const lf = L[dir > 0 ? at : nx]; at = nx; render(); lf.style.zIndex = 900; clearTimeout(lf._t); lf._t = setTimeout(() => render(), 1050); };
    /* 10/11 (Erling): no fim, a seta da direita vira "voltar ao começo" e o livro fecha folha por folha, rápido */
    const restart = () => { const step = () => { if (at <= 0) return; at--; render(); setTimeout(step, 90); }; step(); };
    ab.addEventListener('click', (e) => { const b = e.target.closest('[data-ab]'); if (b) { if (b.dataset.ab === '1' && at === L.length) restart(); else flip(+b.dataset.ab); return; }
      const lf = e.target.closest('.leaf'); if (lf && !e.target.closest('[data-lb]')) { const i = L.indexOf(lf); flip(i < at ? -1 : 1); } });
    /* clicar na capa abre o livro (sem abrir o lightbox) */
    book.addEventListener('click', (e) => { if (e.target.closest('.abp--cover')) flip(1); });
    let sx = 0; book.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    book.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) flip(dx < 0 ? 1 : -1); });
    addEventListener('keydown', (e) => { const r = ab.getBoundingClientRect(); if (r.top > innerHeight || r.bottom < 0 || document.querySelector('.sheet:not([hidden]), .reader:not([hidden]), .lb:not([hidden])')) return; if (e.key === 'ArrowRight') flip(1); if (e.key === 'ArrowLeft') flip(-1); });
    void narrow; render();
  }

  /* ---- a Bíblia deitada na mesa: clique abre, ler online ou baixar ---- */
  const tome = $('[data-tome]'), menu = $('#tomeMenu');
  if (tome && menu) {
    tome.addEventListener('click', () => { const on = menu.hidden; menu.hidden = !on; tome.classList.toggle('is-open', on); if (on && window.gsap) gsap.fromTo(menu, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4 }); });
  }

  /* ---- embaixador: o botão marca a caixa no formulário ---- */
  document.addEventListener('click', (e) => { if (e.target.closest('[data-amb]')) { const c = document.querySelector('#betaForm [name=embaixador]'); if (c) c.checked = true; } });

  /* ---- Brasil: o olho do pergaminho, verde e amarelo, olha e se fecha conforme se desce ---- */
  if (window.gsap && window.ScrollTrigger && !reduce) {
    const up = '.brasil__eye .eye__up', dn = '.brasil__eye .eye__dn';
    gsap.set(up, { y: -110 }); gsap.set(dn, { y: 110 });
    gsap.timeline({ scrollTrigger: { trigger: '.brasil', start: 'top 60%', end: 'bottom 40%', scrub: 0.8 } })
      .to('.brasil__eye .eye__iris', { x: -14, duration: 0.25 }).to('.brasil__eye .eye__iris', { x: 14, duration: 0.3 }).to('.brasil__eye .eye__iris', { x: 0, duration: 0.2 })
      .to(up, { y: 0, duration: 0.5, ease: 'power2.in' }, '>-0.05').to(dn, { y: 0, duration: 0.5, ease: 'power2.in' }, '<').to('.brasil__eye .eye__line', { opacity: 1, duration: 0.1 }, '>-0.05');
  }
})();
/* as faixas de imagens do mundo também abrem no carrossel */
document.querySelectorAll('.world__row img').forEach((im) => { im.dataset.lb = im.getAttribute('src'); im.dataset.cap = im.alt; im.style.cursor = 'zoom-in'; });
document.querySelector('.world')?.setAttribute('data-gal', '');
/* bandeiras: Enter/Espaço abre a facção */
document.querySelectorAll('.flag[data-more]').forEach((f) => f.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f.click(); } }));
/* mundo vivo: as imagens do dia, da noite e dos eventos abrem no carrossel junto com as do mundo */
document.querySelectorAll('.live .dn img, .live .ev img, .pillar img').forEach((im) => { im.dataset.lb = im.getAttribute('src'); im.dataset.cap = im.alt; im.style.cursor = 'zoom-in'; });
/* 10/11 (Erling): as vidas passadas viram um carrossel — uma de cada vez, puxada para a tela como num elástico */
(() => {
  const car = document.querySelector('.rb-car'); if (!car) return; const S = [...car.querySelectorAll('.story')]; if (!S.length) return;
  const dots = car.querySelector('.rb__dots'); dots.innerHTML = S.map((_, i) => `<button type="button" data-rbi="${i}" aria-label="Vida ${i + 1}"></button>`).join('');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; let cur = 0, busy = false, auto = 0;
  const enter = (st) => { const ls = st.querySelectorAll('.rebirth__lines p'), r1 = st.querySelector('.rv1'), r2 = st.querySelector('.rv2');
    if (!window.gsap || reduce) { ls.forEach((p) => { p.style.opacity = 1; p.style.filter = 'none'; p.style.transform = 'none'; }); if (r1) r1.style.opacity = .95; if (r2) r2.style.opacity = .4; return; }
    gsap.fromTo(ls, { opacity: 0, x: 60, filter: 'blur(8px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.9, stagger: 0.18, ease: 'power3.out', delay: 0.25 });
    gsap.fromTo(r1, { opacity: 0, scale: 0.8, x: 140 }, { opacity: 0.95, scale: 1, x: 0, duration: 1.4, ease: 'elastic.out(1, 0.55)' });
    gsap.fromTo(r2, { opacity: 0, scale: 0.7, x: 200 }, { opacity: 0.4, scale: 0.95, x: 0, duration: 1.6, ease: 'elastic.out(1, 0.6)', delay: 0.1 }); };
  const set = () => { S.forEach((st, i) => st.classList.toggle('on', i === cur)); dots.querySelectorAll('button').forEach((d, i) => d.classList.toggle('on', i === cur)); };
  const go = (i, dir) => { if (busy) return; const nx = (i + S.length) % S.length; if (nx === cur) return; const from = S[cur], to = S[nx]; dir = dir || (nx > cur ? 1 : -1);
    if (!window.gsap || reduce) { cur = nx; set(); enter(to); return; } busy = true;
    gsap.to(from, { xPercent: -45 * dir, opacity: 0, duration: 0.45, ease: 'back.in(1.6)', onComplete: () => { gsap.set(from, { xPercent: 0, opacity: 1 }); cur = nx; set();
      gsap.fromTo(to, { xPercent: 60 * dir, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 1.1, ease: 'elastic.out(1, 0.6)', onComplete: () => { busy = false; } }); enter(to); } }); };
  car.addEventListener('click', (e) => { const b = e.target.closest('[data-rb]'); if (b) { go(cur + +b.dataset.rb, +b.dataset.rb); restart(); return; } const d = e.target.closest('[data-rbi]'); if (d) { go(+d.dataset.rbi); restart(); } });
  let sx = 0; car.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  car.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) { go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); restart(); } });
  const restart = () => { clearInterval(auto); if (!reduce) auto = setInterval(() => go(cur + 1, 1), 9000); };
  let seen = false; new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { if (!seen) { seen = true; enter(S[cur]); } restart(); } else clearInterval(auto); }), { threshold: 0.35 }).observe(car);
  set();
})();
