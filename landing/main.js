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

  formInit();
  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) { const lenis = new Lenis({ lerp: 0.09 }); lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const id = a.getAttribute('href'); if (id.length < 2) return; const t = document.querySelector(id); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: id === '#beta' ? -40 : 0 }); } })); }

  /* 1. abertura: o contorno do nome aparece; o emblema acende; a frase sai do desfoque; o mundo surge ao fundo */
  const word = document.querySelector('.hero__word text');
  const len = 9000; word.style.strokeDasharray = len; word.style.strokeDashoffset = len;
  gsap.to(word, { strokeDashoffset: 0, duration: 2.6, ease: 'power2.inOut' });
  gsap.fromTo('.hero__word', { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 2.2, ease: 'power2.out' });
  /* o olho do KK começa apagado, surge do escuro e ACENDE: brilho cresce no centro, clarão, e a brasa fica viva (pulsando de leve) */
  gsap.set('.hero__emblem', { xPercent: -50, yPercent: -58 });
  /* 10/11 (Erling): o nome desenha, esmaece e SOME; só então o emblema surge e o olho acende */
  const eye = gsap.timeline({ delay: 2.6 });
  eye.to('.hero__word', { opacity: 0, scale: 0.96, filter: 'blur(6px)', duration: 1.1, ease: 'power2.in' });
  eye.fromTo('.hero__emblem', { opacity: 0, scale: 0.94, filter: 'blur(10px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.6, ease: 'power2.out' })
    .fromTo('.em-flare', { opacity: 0, scale: 0.15 }, { opacity: 0.9, scale: 0.7, duration: 0.9, ease: 'power2.in' }, '+=0.3')
    .to('.em-on', { opacity: 1, duration: 0.35, ease: 'power1.in' }, '-=0.15')
    .to('.em-flare', { opacity: 1, scale: 1.7, duration: 0.25, ease: 'power2.out' }, '<')
    .to('.em-flare', { opacity: 0.35, scale: 1.1, duration: 1.2, ease: 'power2.out' })
    .add(() => gsap.to('.em-flare', { opacity: 0.55, scale: 1.2, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: 0.8 } });
  tl.to('.hero__tag span', { opacity: 1, filter: 'blur(0px)', stagger: 0.35, duration: 0.8 }, 0.7)
    .to('.hero__sub', { opacity: 1, duration: 0.6 }, 1.6)
    .to('.hero__bg', { opacity: 1, scale: 1, duration: 1.6 }, 1.4)
    .to('.hero__ew', { opacity: 0.3, scale: 0.8, duration: 1 }, 1.8)
    .to('.hero__cta', { opacity: 1, duration: 0.5, onStart: () => document.querySelector('.hero__cta').classList.add('on') }, 2.2)
    .to('.hero__scroll', { opacity: 0, duration: 0.3 }, 0);

  /* 2. manifesto: as palavras acendem em sequência */
  gsap.to('.manifesto__text .w', { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: '.manifesto', start: 'top 70%', end: 'bottom 60%', scrub: true } });

  /* 3. pilares: rolagem vertical vira lateral */
  const track = document.querySelector('.pillars__track');
  const dist = () => track.scrollWidth - innerWidth + 40;
  gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.pillars', pin: '.pillars__pin', start: 'top top', end: () => '+=' + dist(), scrub: 0.6, invalidateOnRefresh: true } });

  /* 4. reencarnação: linha por linha */
  gsap.utils.toArray('.rebirth__lines p').forEach((p, i) => gsap.to(p, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 82%' }, delay: i * 0.05 }));
  gsap.fromTo('.rebirth__art', { xPercent: 10 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: '.rebirth', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* 5. caminhos: entram em cascata */
  gsap.from('.path', { y: 60, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07, scrollTrigger: { trigger: '.paths__grid', start: 'top 80%' } });

  /* 6. mundo: faixas que correm em sentidos opostos */
  document.querySelectorAll('.world__row').forEach((row) => { const d = +row.dataset.dir; gsap.fromTo(row, { x: d < 0 ? 0 : -row.scrollWidth * 0.3 }, { x: d < 0 ? -row.scrollWidth * 0.3 : 0, ease: 'none', scrollTrigger: { trigger: '.world', start: 'top bottom', end: 'bottom top', scrub: true } }); });

  /* 7. arte: parallax leve em cada peça */
  gsap.utils.toArray('.art__grid img').forEach((im, i) => gsap.fromTo(im, { y: 40 + (i % 3) * 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: im, start: 'top 92%' } }));

  /* 8. brasil */
  gsap.from('.brasil__big', { opacity: 0, y: 50, filter: 'blur(12px)', duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: '.brasil__big', start: 'top 80%' } });
  gsap.fromTo('.brasil__seal', { rotate: -4, scale: 0.9, opacity: 0 }, { rotate: 0, scale: 1, opacity: 0.9, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: '.brasil', start: 'top 75%' } });

  addEventListener('load', () => ScrollTrigger.refresh());

  /* formulário do beta */
  function formInit() {
    const f = document.getElementById('betaForm'); if (!f) return; const msg = f.querySelector('.beta__msg'), btn = f.querySelector('button');
    f.addEventListener('submit', async (e) => { e.preventDefault(); msg.className = 'beta__msg'; msg.textContent = '';
      const d = Object.fromEntries(new FormData(f).entries());
      if (!d.nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || '')) { msg.classList.add('err'); msg.textContent = 'Preencha nome e um e-mail válido.'; return; }
      if (!d.ok) { msg.classList.add('err'); msg.textContent = 'Marque a caixa de aceite para receber o convite.'; return; }
      btn.disabled = true; btn.textContent = 'Enviando…';
      try { const r = await fetch('/api/beta', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) }); const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'erro'); f.reset(); msg.classList.add('ok'); msg.textContent = '✦ Inscrição recebida. Fique de olho no seu e-mail: o convite chega antes da próxima rodada.'; btn.textContent = 'Inscrito ✦'; }
      catch (err) { msg.classList.add('err'); msg.textContent = 'Não deu certo agora. Tente de novo em instantes.'; btn.disabled = false; btn.textContent = 'Quero ser beta tester'; } });
  }
})();
