/* KARMIKA — landing. Rolagem suave (Lenis) + cenas presas ao scroll (GSAP ScrollTrigger). */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.querySelector('.nav');
  addEventListener('scroll', () => nav.classList.toggle('is-solid', scrollY > innerHeight * 0.9), { passive: true });

  /* manifesto: cada palavra vira um span (acende conforme rola) */
  document.querySelectorAll('[data-words]').forEach((el) => {
    const walk = (node) => { for (const n of [...node.childNodes]) { if (n.nodeType === 3) { const frag = document.createDocumentFragment(); n.textContent.split(/(\s+)/).forEach((w) => { if (!w.trim()) frag.append(w); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; frag.append(s); } }); n.replaceWith(frag); } else walk(n); } };
    walk(el);
  });

  formInit(); pathsInit(); lightboxInit();
  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) { const lenis = new Lenis({ lerp: 0.09 }); window.__lenis = lenis; lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const id = a.getAttribute('href'); if (id.length < 2) return; const t = document.querySelector(id); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: id === '#beta' ? -40 : 0 }); } })); }

  /* 1. abertura (Erling, 10/11): o nome desenha e some → o emblema surge apagado → o olho ACENDE → o emblema some por inteiro →
     a vila de Karmika aparece atrás → a frase e o botão. Só então a página rola (a rolagem fica presa durante a abertura; clique acelera). */
  const word = document.querySelector('.hero__word text');
  const len = 9000; word.style.strokeDasharray = len; word.style.strokeDashoffset = len;
  gsap.set('.hero__emblem', { xPercent: -50, yPercent: -58 });
  const lock = (on) => { document.documentElement.style.overflow = on ? 'hidden' : ''; if (window.__lenis) on ? window.__lenis.stop() : window.__lenis.start(); };
  lock(true);
  const intro = gsap.timeline({ onComplete: () => lock(false) });
  intro.fromTo('.hero__word', { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 2.6, ease: 'power2.out' }, 0)
    .to(word, { strokeDashoffset: 0, duration: 3.6, ease: 'power2.inOut' }, 0)
    .to('.hero__word', { opacity: 0, scale: 0.96, filter: 'blur(6px)', duration: 1.4, ease: 'power2.in' }, 4.0)
    .fromTo('.hero__emblem', { opacity: 0, scale: 0.94, filter: 'blur(10px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.4, ease: 'power2.out' }, 5.5)
    .fromTo('.em-flare', { opacity: 0, scale: 0.15 }, { opacity: 0.9, scale: 0.7, duration: 0.9, ease: 'power2.in' }, 7.1)
    .to('.em-on', { opacity: 1, duration: 0.35, ease: 'power1.in' }, 7.85)
    .to('.em-flare', { opacity: 1, scale: 1.7, duration: 0.25, ease: 'power2.out' }, 7.85)
    .to('.em-flare', { opacity: 0.4, scale: 1.1, duration: 1.0, ease: 'power2.out' }, 8.1)
    .to('.hero__emblem', { opacity: 0, scale: 1.06, filter: 'blur(8px)', duration: 1.3, ease: 'power2.in' }, 9.4)
    .fromTo('.hero__bg', { opacity: 0, scale: 1.18 }, { opacity: 1, scale: 1, duration: 2.2, ease: 'power2.out' }, 10.5)
    .to('.hero__tag span', { opacity: 1, filter: 'blur(0px)', stagger: 0.3, duration: 0.8 }, 11.2)
    .to('.hero__sub', { opacity: 1, duration: 0.6 }, 12.2)
    .to('.hero__cta', { opacity: 1, duration: 0.5, onStart: () => document.querySelector('.hero__cta').classList.add('on') }, 12.4)
    .fromTo('.hero__scroll', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 12.6);
  const skip = () => { if (intro.isActive()) intro.timeScale(2.5); }; /* 10/11: só clique ou tecla aceleram (a roda do mouse acelerava sem querer) */
  addEventListener('click', skip, { once: true }); addEventListener('keydown', skip, { once: true });
  /* depois da abertura, rolar leva o cenário para trás com calma */
  gsap.to('.hero__stage > *:not(.hero__bg)', { opacity: 0, y: -40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__bg', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* 2. manifesto: as palavras acendem em sequência */
  gsap.to('.manifesto__text .w', { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: '.manifesto', start: 'top 70%', end: 'bottom 60%', scrub: true } });

  /* 3. pilares: rolagem vertical vira lateral */
  const track = document.querySelector('.pillars__track');
  const dist = () => track.scrollWidth - innerWidth + 40;
  gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.pillars', pin: '.pillars__pin', start: 'top top', end: () => '+=' + dist(), scrub: 0.6, invalidateOnRefresh: true } });

  /* 4. reencarnação: linha por linha */
  gsap.utils.toArray('.rebirth__lines p').forEach((p, i) => gsap.to(p, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 82%' }, delay: i * 0.05 }));
  /* o vampiro surge do escuro e cresce no fundo enquanto as frases aparecem; na última ("E ainda sinto sede") está inteiro */
  const rv = gsap.timeline({ scrollTrigger: { trigger: '.rebirth', start: 'top 85%', end: 'bottom 60%', scrub: 0.8 } });
  rv.fromTo('.rebirth__art .rv1', { opacity: 0, scale: 0.55, y: 60, filter: 'blur(8px) brightness(.4) drop-shadow(0 0 0 rgba(163,36,44,0))' }, { opacity: 0.95, scale: 1.08, y: 0, filter: 'blur(0px) brightness(.95) drop-shadow(0 0 70px rgba(163,36,44,.55))', ease: 'power1.out', duration: 1 }, 0)
    .fromTo('.rebirth__art .rv2', { opacity: 0, scale: 0.5, x: 40 }, { opacity: 0.45, scale: 0.95, x: 0, ease: 'power1.out', duration: 1 }, 0.15);

  /* 5. caminhos: entram em cascata */
  /* (os cartões entram por IntersectionObserver: pathsInit) */

  /* 6. mundo: faixas que correm em sentidos opostos */
  document.querySelectorAll('.world__row').forEach((row) => { const d = +row.dataset.dir; gsap.fromTo(row, { x: d < 0 ? 0 : -row.scrollWidth * 0.3 }, { x: d < 0 ? -row.scrollWidth * 0.3 : 0, ease: 'none', scrollTrigger: { trigger: '.world', start: 'top bottom', end: 'bottom top', scrub: true } }); });

  /* 7. arte: parallax leve em cada peça */
  gsap.utils.toArray('.art__grid img').forEach((im, i) => gsap.fromTo(im, { y: 40 + (i % 3) * 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: im, start: 'top 92%' } }));

  /* 8. brasil */
  gsap.from('.brasil__big', { opacity: 0, y: 50, filter: 'blur(12px)', duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: '.brasil__big', start: 'top 80%' } });
  gsap.fromTo('.brasil__seal', { rotate: -4, scale: 0.9, opacity: 0 }, { rotate: 0, scale: 1, opacity: 1, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: '.brasil', start: 'top 75%' } });
  gsap.fromTo('.manifesto__kick, .manifesto__end', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: 'power3.out', scrollTrigger: { trigger: '.manifesto', start: 'top 70%' } });

  addEventListener('load', () => ScrollTrigger.refresh());

  /* formulário do beta */
  function formInit() {
    const f = document.getElementById('betaForm'); if (!f) return; const msg = f.querySelector('.beta__msg'), btn = f.querySelector('button');
    f.addEventListener('submit', async (e) => { e.preventDefault(); msg.className = 'beta__msg'; msg.textContent = '';
      const d = Object.fromEntries(new FormData(f).entries()); d.embaixador = !!d.embaixador;
      if (!d.nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || '')) { msg.classList.add('err'); msg.textContent = 'Preencha nome e um e-mail válido.'; return; }
      if (!d.ok) { msg.classList.add('err'); msg.textContent = 'Marque a caixa de aceite para receber o convite.'; return; }
      btn.disabled = true; btn.textContent = 'Enviando…';
      try { const r = await fetch('/api/beta', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) }); const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'erro'); f.reset(); msg.classList.add('ok'); msg.textContent = '✦ Inscrição recebida. Fique de olho no seu e-mail: o convite chega antes da próxima rodada.'; btn.textContent = 'Inscrito ✦'; }
      catch (err) { msg.classList.add('err'); msg.textContent = 'Não deu certo agora. Tente de novo em instantes.'; btn.disabled = false; btn.textContent = 'Quero ser beta tester'; } });
  }

  /* ===== raças e caminhos: clicar abre o painel (os outros viram miniaturas), com história, magias, poses e artbook ===== */
  function pathsInit() {
    const grid = document.getElementById('pathsGrid'), det = document.getElementById('pathDetail'), sec = document.getElementById('caminhos'); const C = window.KARMIKA_CLASSES || []; if (!grid) return;
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    grid.innerHTML = C.map((c, i) => `<figure class="path${c.soon ? ' path--soon' : ''}" role="listitem" tabindex="0" data-i="${i}" aria-label="${esc(c.nome)}: abrir detalhes">${c.retratos.length ? `<img src="/img/${c.retratos[0]}.webp" alt="${esc(c.nome)}" loading="lazy">` : '<div class="path__ph"><img src="/img/logo-bronze.webp" alt=""><em>em breve</em></div>'}<figcaption><b>${esc(c.nome)}</b><span>${esc(c.tipo)} · ${esc(c.casa.split(' · ')[0])}</span><i>${esc(c.lema)}</i></figcaption></figure>`).join('');
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { const el = e.target; setTimeout(() => el.classList.add('in'), (+el.dataset.i % 6) * 70); io.unobserve(el); } }), { rootMargin: '0px 0px -10% 0px' }); grid.querySelectorAll('.path').forEach((el) => io.observe(el));
    let cur = -1;
    const open = (i) => { const c = C[i]; if (!c) return; cur = i; sec.classList.add('is-open'); grid.querySelectorAll('.path').forEach((el) => el.classList.toggle('is-sel', +el.dataset.i === i));
      /* 10/11 (Erling): macho e fêmea lado a lado à direita; ao fundo, apagada, a pose de cada um (sem repetir a mesma figura) */
      const FEM = /(-f$|a$|lobisoma$)/, ret = c.retratos || [], nm = (r) => r.replace('c-', '').replace(/-ab$/, ''), male = ret.find((r) => !FEM.test(nm(r))), fem = ret.find((r) => FEM.test(nm(r)));
      const poses = c.poses || [], pm = poses.find((p) => /_h$/.test(p)), pf = poses.find((p) => /_m$/.test(p));
      const im = (sel, n) => { const e = det.querySelector(sel); if (n) { e.src = `/img/${n}.webp`; e.alt = c.nome; e.hidden = false; } else { e.hidden = true; e.removeAttribute('src'); } };
      im('.pdet__m', male); im('.pdet__f', fem); im('.pdet__pm', pm); im('.pdet__pf', pf);
      det.querySelector('.pdet__figs').classList.toggle('is-soon', !ret.length);
      det.querySelector('.pdet__kind').textContent = c.tipo === 'Raça' ? 'Raça de nascimento' : 'Caminho';
      det.querySelector('.pdet__name').textContent = c.nome; det.querySelector('.pdet__lema').textContent = c.lema;
      det.querySelector('.pdet__meta').innerHTML = `<dt>Lar</dt><dd>${esc(c.casa)}</dd>${c.mestre ? `<dt>Mestre</dt><dd>${esc(c.mestre)}</dd>` : ''}<dt>Recurso</dt><dd>${esc(c.recurso)}</dd>`;
      det.querySelector('.pdet__hist').innerHTML = c.hist.map((p) => `<p>${esc(p)}</p>`).join('');
      det.querySelector('.pdet__skT').hidden = !c.magias.length;
      det.querySelector('.pdet__skills').innerHTML = c.magias.map((m) => `<div class="skill"><div class="skill__ic">${m.svg || ''}</div><div><b>${esc(m.name)}</b><small>nível ${m.lvl}</small><p>${esc(m.tip)}</p></div></div>`).join('');
      const tl = c.talentos || []; det.querySelector('.pdet__tlT').hidden = det.querySelector('.pdet__tlp').hidden = !tl.length;
      det.querySelector('.pdet__tree').innerHTML = tl.map((b) => `<div class="tbr" style="--c:${b.col}"><b>${esc(b.name)}</b><ul>${b.notables.map((n) => `<li><span>${esc(n.n)}</span><small>${esc(n.t)}</small></li>`).join('')}</ul><div class="tbr__key"><span>◆ ${esc(b.key.n)}</span><small>${esc(b.key.t)}</small></div></div>`).join('');
      det.querySelector('.pdet__artT').hidden = !c.artes.length;
      det.querySelector('.pdet__art').innerHTML = c.artes.map((a) => `<button type="button" data-lb="/img/${a}.webp" data-cap="${esc(c.nome)} — artbook"><img src="/img/${a}.webp" alt="${esc(c.nome)}: arte" loading="lazy"></button>`).join(''); 
      window.__fillGrid?.(det.querySelector('.pdet__art'), 3);
      det.hidden = false;
      if (window.gsap) { gsap.fromTo(det, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }); gsap.fromTo(det.querySelectorAll('.pdet__m:not([hidden]), .pdet__f:not([hidden])'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' }); gsap.fromTo(det.querySelectorAll('.pdet__pm:not([hidden]), .pdet__pf:not([hidden])'), { opacity: 0, scale: 1.1 }, { opacity: 0.22, scale: 1, duration: 1.4, ease: 'power2.out' }); gsap.fromTo(det.querySelectorAll('.skill, .tbr, .pdet__art button'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.025, ease: 'power2.out', delay: 0.2 }); }
      const top = sec.getBoundingClientRect().top + scrollY - 70; if (Math.abs(scrollY - top) > 200) scrollTo({ top, behavior: 'smooth' });
      if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 700); };
    const close = () => { cur = -1; sec.classList.remove('is-open'); det.hidden = true; grid.querySelectorAll('.path').forEach((el) => el.classList.remove('is-sel')); if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 300); };
    grid.addEventListener('click', (e) => { const el = e.target.closest('.path'); if (!el) return; const i = +el.dataset.i; if (i === cur) close(); else open(i); });
    grid.addEventListener('keydown', (e) => { if (e.key !== 'Enter' && e.key !== ' ') return; const el = e.target.closest('.path'); if (!el) return; e.preventDefault(); const i = +el.dataset.i; if (i === cur) close(); else open(i); });
    det.querySelector('.pdet__close').addEventListener('click', close);
    /* parallax leve das figuras com o mouse */
    det.querySelector('.pdet__figs').addEventListener('pointermove', (e) => { if (!window.gsap) return; const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to('.pdet__m, .pdet__f', { x: x * 16, y: y * 6, duration: 0.6 }); gsap.to('.pdet__pm, .pdet__pf', { x: -x * 30, y: -y * 10, duration: 0.8 }); });
  }

  /* ===== lightbox: qualquer [data-lb] abre a imagem grande; clique fora, ✕ ou Esc fecha ===== */
  function lightboxInit() {
    const lb = document.getElementById('lightbox'); if (!lb) return; const img = lb.querySelector('img'), cap = lb.querySelector('.lb__cap');
    const shut = () => { if (window.gsap) gsap.to(lb, { opacity: 0, duration: 0.25, onComplete: () => { lb.hidden = true; } }); else lb.hidden = true; document.documentElement.style.overflow = ''; };
    document.addEventListener('click', (e) => { const b = e.target.closest('[data-lb]'); if (b) { img.src = b.dataset.lb; img.alt = b.dataset.cap || ''; cap.textContent = b.dataset.cap || ''; lb.hidden = false; document.documentElement.style.overflow = 'hidden';
        if (window.gsap) { gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: 0.3 }); gsap.fromTo(img, { scale: 0.9, y: 20 }, { scale: 1, y: 0, duration: 0.5, ease: 'power3.out' }); } return; }
      if (!lb.hidden && (e.target === lb || e.target.closest('.lb__x'))) shut(); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lb.hidden) shut(); });
  }

  /* parallax por dentro das peças do artbook */
  if (window.gsap && !reduce) gsap.utils.toArray('.art__grid button img').forEach((im) => gsap.fromTo(im, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: im.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
})();
