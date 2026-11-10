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

  /* esmaece a tela, faz a troca e reaparece (para pular de lugar sem rolar aos trancos) */
  const fader = document.createElement('div'); fader.className = 'fader'; document.body.append(fader);
  window.__fadeJump = (fn) => { if (!window.gsap || reduce) { fn(); return; } gsap.to(fader, { opacity: 1, duration: 0.32, ease: 'power1.in', onStart: () => { fader.style.pointerEvents = 'auto'; }, onComplete: () => { fn(); requestAnimationFrame(() => gsap.to(fader, { opacity: 0, duration: 0.45, delay: 0.08, ease: 'power1.out', onComplete: () => { fader.style.pointerEvents = 'none'; } })); } }); };
  formInit(); pathsInit(); lightboxInit();
  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) { const lenis = new Lenis({ lerp: 0.09 }); window.__lenis = lenis; lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const id = a.getAttribute('href'); if (id.length < 2) return; const t = document.querySelector(id); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: id === '#beta' ? -40 : 0 }); } })); }

  /* 1. abertura (Erling, 10/11 tarde: "não é animação presa no tempo, é animação no scroll — e precisa girar mais vezes no começo, para não dar
     para acelerar"): a abertura fica presa na tela e anda com a rolagem, devagar. O nome desenha e some → o emblema surge apagado → o olho
     ACENDE → o emblema some → a vila de Karmika aparece → a frase e o botão. Depois disso a página volta a rolar normal, e o subtítulo e o
     botão esmaecem devagar conforme se desce. */
  const word = document.querySelector('.hero__word text');
  const len = 9000; word.style.strokeDasharray = len; word.style.strokeDashoffset = len;
  gsap.set('.hero__emblem', { xPercent: -50, yPercent: -58 });
  const intro = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.hero', start: 'top top', end: () => '+=' + Math.round(innerHeight * 5.2), pin: true, scrub: 1.4, anticipatePin: 1 } });
  intro.to('.hero__start', { opacity: 0, duration: 0.6 }, 0)
    .fromTo('.hero__word', { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 2.6 }, 0)
    .to(word, { strokeDashoffset: 0, duration: 3.6 }, 0)
    .to('.hero__word', { opacity: 0, scale: 0.96, filter: 'blur(6px)', duration: 1.4 }, 4.0)
    .fromTo('.hero__emblem', { opacity: 0, scale: 0.94, filter: 'blur(10px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.4 }, 5.5)
    .fromTo('.em-flare', { opacity: 0, scale: 0.15 }, { opacity: 0.9, scale: 0.7, duration: 0.9 }, 7.1)
    .to('.em-on', { opacity: 1, duration: 0.35 }, 7.85)
    .to('.em-flare', { opacity: 1, scale: 1.7, duration: 0.25 }, 7.85)
    .to('.em-flare', { opacity: 0.4, scale: 1.1, duration: 1.0 }, 8.1)
    .to('.hero__emblem', { opacity: 0, scale: 1.06, filter: 'blur(8px)', duration: 1.3 }, 9.4)
    .fromTo('.hero__bg', { opacity: 0, scale: 1.18 }, { opacity: 1, scale: 1, duration: 2.2 }, 10.5)
    .to('.hero__tag span', { opacity: 1, filter: 'blur(0px)', stagger: 0.3, duration: 0.8 }, 11.2)
    .to('.hero__sub', { opacity: 1, duration: 0.6 }, 12.2)
    .to('.hero__cta', { opacity: 1, duration: 0.5, onStart: () => document.querySelector('.hero__cta').classList.add('on') }, 12.4)
    .fromTo('.hero__scroll', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 12.6)
    .to({}, { duration: 1.2 });
  /* depois da abertura: o subtítulo, o botão e o resto esmaecem devagar com a rolagem, e a praça desce com calma */
  const out = { trigger: '.manifesto', start: 'top bottom', end: 'top 25%', scrub: 1 };
  gsap.to('.hero__sub, .hero__cta, .hero__scroll', { opacity: 0, y: -30, scrollTrigger: out });
  gsap.to('.hero__tag', { opacity: 0, y: -50, scrollTrigger: { ...out, start: 'top 85%' } });

  /* 2. manifesto: as palavras acendem em sequência */
  gsap.to('.manifesto__text .w', { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: '.manifesto', start: 'top 70%', end: 'bottom 60%', scrub: true } });

  /* 3. pilares: rolagem vertical vira lateral */
  const track = document.querySelector('.pillars__track');
  const dist = () => track.scrollWidth - innerWidth + 40;
  gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.pillars', pin: '.pillars__pin', start: 'top top', end: () => '+=' + dist(), scrub: 0.6, invalidateOnRefresh: true } });

  /* 4. vidas passadas (Erling, 10/11): várias histórias, uma depois da outra; em cada uma as frases aparecem e o herói cresce no fundo */
  /* (as vidas passadas agora são um carrossel elástico: extra.js) */

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
        if (!r.ok && j.relay) { /* o servidor não conseguiu: o navegador envia direto ao FormSubmit */
          const r2 = await fetch(j.relay, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(j.fields) }); const j2 = await r2.json().catch(() => ({}));
          if (!r2.ok || String(j2.success) === 'false') { console.warn('beta relay', r2.status, j2); throw new Error('relay'); } }
        else if (!r.ok) throw new Error(j.error || 'erro'); f.reset(); msg.classList.add('ok'); msg.textContent = '✦ Inscrição recebida. Fique de olho no seu e-mail: o convite chega antes da próxima rodada.'; btn.textContent = 'Inscrito ✦'; }
      catch (err) { msg.classList.add('err'); msg.textContent = 'Não deu certo agora. Tente de novo em instantes.'; btn.disabled = false; btn.textContent = 'Quero ser beta tester'; } });
  }

  /* ===== raças e caminhos: clicar abre o painel (os outros viram miniaturas), com história, magias, poses e artbook ===== */
  function pathsInit() {
    const grid = document.getElementById('pathsGrid'), det = document.getElementById('pathDetail'), sec = document.getElementById('caminhos'); const C = window.KARMIKA_CLASSES || []; if (!grid) return;
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    grid.innerHTML = C.map((c, i) => `<figure class="path${c.soon ? ' path--soon' : ''}" role="listitem" tabindex="0" data-i="${i}" aria-label="${esc(c.nome)}: abrir detalhes">${c.retratos.length ? `<img src="/img/${c.retratos[0]}.webp" alt="${esc(c.nome)}" loading="lazy">` : '<div class="path__ph"><img src="/img/logo-bronze.webp" alt=""><em>em breve</em></div>'}<figcaption><b>${esc(c.nome)}</b><span>${esc(c.tipo)} · ${esc(c.casa.split(' · ')[0])}</span><i>${esc(c.lema)}</i></figcaption></figure>`).join('');
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { const el = e.target; setTimeout(() => el.classList.add('in'), (+el.dataset.i % 6) * 70); io.unobserve(el); } }), { rootMargin: '0px 0px -10% 0px' }); grid.querySelectorAll('.path').forEach((el) => io.observe(el));
    let cur = -1;
    const open = (i, quiet) => { const c = C[i]; if (!c) return; cur = i; if (!quiet) window.__pathBack = null; sec.classList.add('is-open'); grid.querySelectorAll('.path').forEach((el) => el.classList.toggle('is-sel', +el.dataset.i === i));
      /* 10/11 (Erling): macho e fêmea lado a lado à direita; ao fundo, apagada, a pose de cada um (sem repetir a mesma figura) */
      const FEM = /(-f$|a$|lobisoma$)/, ret = c.retratos || [], nm = (r) => r.replace('c-', '').replace(/-ab$/, ''), male = ret.find((r) => !FEM.test(nm(r))), fem = ret.find((r) => FEM.test(nm(r)));
      const poses = c.poses || [], pm = poses.find((p) => /_h$/.test(p)), pf = poses.find((p) => /_m$/.test(p));
      const im = (sel, n) => { const e = det.querySelector(sel); if (n) { e.src = `/img/${n}.webp`; e.alt = c.nome; e.hidden = false; } else { e.hidden = true; e.removeAttribute('src'); } };
      im('.pdet__m', male); im('.pdet__f', fem); im('.pdet__pm', pm); im('.pdet__pf', pf);
      det.querySelector('.pdet__figs').classList.toggle('is-soon', !ret.length);
      det.dataset.fac = c.fac || ''; sec.dataset.fac = c.fac || '';
      det.querySelector('.pdet__kind').textContent = c.tipo === 'Raça' ? 'Raça de nascimento' : c.fac === 'fio' ? 'Caminho · A Ordem do Fio' : c.fac === 'desf' ? 'Caminho · Os Desfiados' : 'Caminho · sem bandeira';
      det.querySelector('.pdet__name').textContent = c.nome; det.querySelector('.pdet__lema').textContent = c.lema;
      det.querySelector('.pdet__meta').innerHTML = `<dt>Lar</dt><dd>${esc(c.casa)}</dd>${c.mestre ? `<dt>Mestre</dt><dd>${esc(c.mestre)}</dd>` : ''}<dt>Recurso</dt><dd>${esc(c.recurso)}</dd>`;
      det.querySelector('.pdet__hist').innerHTML = c.hist.map((p) => `<p>${esc(p)}</p>`).join('');
      det.querySelector('.pdet__skT').hidden = !c.magias.length;
      det.querySelector('.pdet__skills').innerHTML = c.magias.map((m) => `<div class="skill"><div class="skill__ic">${m.svg || ''}</div><div><b>${esc(m.name)}</b><small>nível ${m.lvl}</small><p>${esc(m.tip)}</p></div></div>`).join('');
      const tl = c.talentos || []; det.querySelector('.pdet__tlT').hidden = det.querySelector('.pdet__tlp').hidden = !tl.length;
      const T = window.KARMIKA_TREE; let svg = '';
      if (T && tl.length) { const col = (b) => (b >= 0 && b < 3 ? tl[b].col : '#d9a54a'); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; T.n.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
        const pad = 1.2, R = { s: 0.2, n: 0.36, k: 0.55, o: 0.7 }; let e = ''; for (let i = 0; i < T.e.length; i += 2) { const a = T.n[T.e[i]], b = T.n[T.e[i + 1]]; e += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${col(a[3] >= 0 && a[3] < 3 ? a[3] : b[3])}"/>`; }
        const nodes = T.n.map(([x, y, k, b], i) => `<circle cx="${x}" cy="${y}" r="${R[k] || 0.2}" fill="${k === 'o' ? '#ffd27a' : col(b)}" class="tn tn--${k}" style="animation-delay:${(i % 23) * 0.13}s"/>`).join('');
        svg = `<svg class="cst" viewBox="${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}" role="img" aria-label="A constelação de talentos de ${esc(c.nome)}"><g class="cst__e">${e}</g>${nodes}${tl.map((b, i) => { const ks = T.n.filter((q) => q[2] === 'k' && q[3] === i)[0]; return ks ? `<text x="${ks[0]}" y="${ks[1] + 1.4}" fill="${b.col}">${esc(b.key.n)}</text>` : ''; }).join('')}</svg>`; }
      det.querySelector('.pdet__cst').innerHTML = svg;
      det.querySelector('.pdet__tree').innerHTML = tl.map((b) => `<div class="tbr" style="--c:${b.col}"><b>${esc(b.name)}</b><ul>${b.notables.map((n) => `<li><span>${esc(n.n)}</span><small>${esc(n.t)}</small></li>`).join('')}</ul><div class="tbr__key"><span>◆ ${esc(b.key.n)}</span><small>${esc(b.key.t)}</small></div></div>`).join('');
      const pc = c.passClasse || [], pmg = c.passMagia || []; det.querySelector('.pdet__psT').hidden = !pc.length;
      det.querySelector('.pdet__pass').innerHTML = pc.length ? `<div class="psb"><b>Passivas de classe <small>${pc.length}</small></b><div class="psl">${pc.map((p) => `<span class="ps" tabindex="0"><i>${esc(p.n)}</i><small>${p.l} níveis</small><em>${esc(p.t)}</em></span>`).join('')}</div></div><div class="psb"><b>Passivas de magia <small>${pmg.length}</small></b><div class="psl">${pmg.map((p) => `<span class="ps ps--m" tabindex="0"><i>${esc(p.n)}</i><small>${esc(p.a)}</small><em>${esc(p.t)}</em></span>`).join('')}</div></div>` : '';
      det.querySelector('.pdet__artT').hidden = !c.artes.length;
      det.querySelector('.pdet__art').innerHTML = c.artes.map((a) => `<button type="button" data-lb="/img/${a}.webp" data-cap="${esc(c.nome)} — artbook"><img src="/img/${a}.webp" alt="${esc(c.nome)}: arte" loading="lazy"></button>`).join(''); 
      window.__fillGrid?.(det.querySelector('.pdet__art'), 3);
      det.hidden = false;
      if (window.gsap) { gsap.fromTo(det, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }); gsap.fromTo(det.querySelectorAll('.pdet__m:not([hidden]), .pdet__f:not([hidden])'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' }); gsap.fromTo(det.querySelectorAll('.pdet__pm:not([hidden]), .pdet__pf:not([hidden])'), { opacity: 0, scale: 1.1 }, { opacity: 0.22, scale: 1, duration: 1.4, ease: 'power2.out' }); gsap.fromTo(det.querySelectorAll('.skill, .tbr, .pdet__art button'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.025, ease: 'power2.out', delay: 0.2 }); }
      /* 10/11 (Erling): nada de rolar a página aos trancos — a tela esmaece, pula e reaparece no painel aberto */
      const jump = () => { const top = sec.querySelector('.paths__grid').getBoundingClientRect().top + scrollY - 70; window.__lenis ? window.__lenis.scrollTo(top, { immediate: true, force: true }) : scrollTo(0, top); };
      if (quiet) jump(); else { const r = det.getBoundingClientRect(); if (r.top < 60 || r.top > innerHeight * 0.5) jump(); }
      if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 700); };
    window.__openPath = (i, quiet) => open(i, quiet);
    const close = () => { const back = window.__pathBack; window.__pathBack = null;
      if (back) { window.__fadeJump(() => { cur = -1; sec.classList.remove('is-open'); det.hidden = true; grid.querySelectorAll('.path').forEach((el) => el.classList.remove('is-sel')); window.__lenis ? window.__lenis.scrollTo(back.y, { immediate: true, force: true }) : scrollTo(0, back.y); if (back.id) window.__openMore?.(back.id, back.top); }); return; }
      cur = -1; sec.classList.remove('is-open'); det.hidden = true; grid.querySelectorAll('.path').forEach((el) => el.classList.remove('is-sel')); if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 300); };
    grid.addEventListener('click', (e) => { const el = e.target.closest('.path'); if (!el) return; const i = +el.dataset.i; if (i === cur) close(); else if (cur < 0) window.__fadeJump(() => open(i, true)); else open(i); });
    grid.addEventListener('keydown', (e) => { if (e.key !== 'Enter' && e.key !== ' ') return; const el = e.target.closest('.path'); if (!el) return; e.preventDefault(); const i = +el.dataset.i; if (i === cur) close(); else open(i); });
    det.querySelector('.pdet__close').addEventListener('click', close);
    /* parallax leve das figuras com o mouse */
    det.querySelector('.pdet__figs').addEventListener('pointermove', (e) => { if (!window.gsap) return; const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to('.pdet__m, .pdet__f', { x: x * 16, y: y * 6, duration: 0.6 }); gsap.to('.pdet__pm, .pdet__pf', { x: -x * 30, y: -y * 10, duration: 0.8 }); });
  }

  /* ===== lightbox: qualquer [data-lb] abre a imagem grande; clique fora, ✕ ou Esc fecha ===== */
  function lightboxInit() {
    /* 10/11 (Erling: "ao clicar numa imagem, um carrossel de imagens"): as imagens do mesmo grupo (painel, seção ou galeria) passam com setas, teclado e dedo */
    const lb = document.getElementById('lightbox'); if (!lb) return; const img = lb.querySelector('img'), cap = lb.querySelector('.lb__cap'), n = lb.querySelector('.lb__n');
    let list = [], at = 0;
    const show = (k, dir) => { at = (k + list.length) % list.length; const b = list[at]; img.src = b.dataset.lb; img.alt = b.dataset.cap || ''; cap.textContent = b.dataset.cap || ''; n.textContent = list.length > 1 ? `${at + 1} / ${list.length}` : '';
      lb.classList.toggle('lb--one', list.length < 2); if (window.gsap && dir) gsap.fromTo(img, { opacity: 0, x: 40 * dir }, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' }); };
    const shut = () => { if (window.gsap) gsap.to(lb, { opacity: 0, duration: 0.25, onComplete: () => { lb.hidden = true; } }); else lb.hidden = true; if (document.getElementById('sheet')?.hidden !== false && document.getElementById('reader')?.hidden !== false) { document.documentElement.style.overflow = ''; window.__lenis?.start(); } };
    document.addEventListener('click', (e) => { const b = e.target.closest('[data-lb]'); if (b && !lb.contains(b)) { e.preventDefault();
        const scope = b.closest('[data-gal], .sheet__body, section, .pdet') || document.body; list = [...scope.querySelectorAll('[data-lb]')].filter((x) => !x.closest('.lb')); at = list.indexOf(b); if (at < 0) { list = [b]; at = 0; }
        show(at); lb.hidden = false; document.documentElement.style.overflow = 'hidden'; window.__lenis?.stop();
        if (window.gsap) { gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: 0.3 }); gsap.fromTo(img, { scale: 0.9, y: 20 }, { scale: 1, y: 0, duration: 0.5, ease: 'power3.out' }); } return; }
      if (lb.hidden) return; const ar = e.target.closest('[data-lbm]'); if (ar) { show(at + +ar.dataset.lbm, +ar.dataset.lbm); return; }
      if (e.target === lb || e.target.closest('.lb__x')) shut(); });
    addEventListener('keydown', (e) => { if (lb.hidden) return; if (e.key === 'Escape') shut(); if (e.key === 'ArrowRight') show(at + 1, 1); if (e.key === 'ArrowLeft') show(at - 1, -1); }, true);
    let sx = 0; lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true }); lb.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40 && list.length > 1) show(at + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); });
  }

  /* parallax por dentro das peças do artbook */
  if (window.gsap && !reduce) gsap.utils.toArray('.art__grid button img').forEach((im) => gsap.fromTo(im, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: im.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
})();
