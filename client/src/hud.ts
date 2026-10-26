/** HUD: globos de vida/magia com líquido "de verdade" (canvas 2D), moldura brilhante e o Olho Kármico que acompanha o jogador. */

interface Liquid { level: number; vel: number; wave: number; wVel: number; bubbles: { x: number; y: number; r: number; v: number }[]; drips: { x: number; y: number; v: number; r: number }[] }
export function createGlobes() {
  const mk = (id: string) => { const host = document.getElementById(id)!; const c = document.createElement('canvas'); c.width = c.height = 128; c.className = 'globe'; host.insertBefore(c, host.firstChild); return c; };
  const hpC = mk('hp'), mpC = mk('mp');
  const L: Record<'hp' | 'mp', Liquid> = { hp: { level: 1, vel: 0, wave: 0, wVel: 0, bubbles: [], drips: [] }, mp: { level: 1, vel: 0, wave: 0, wVel: 0, bubbles: [], drips: [] } };
  let t = 0;
  /* cada caminho tem o seu líquido: Mana azul, Ímpeto em brasa, Energia elétrica, Sangue, Fúria, Ódio, Fé */
  const PAL: Record<string, { c: [string, string, string, string]; bg: string; men: string; part: 'bubble' | 'ember' | 'spark' | 'mote' }> = {
    mana: { c: ['#8ad8ff', '#2e78e8', '#142a8a', '#0a1240'], bg: '#0e1830', men: 'rgba(200,240,255,.8)', part: 'bubble' },
    impeto: { c: ['#ffd27a', '#ff7a1c', '#b8300a', '#4a0c04'], bg: '#2a1008', men: 'rgba(255,220,150,.9)', part: 'ember' },
    energia: { c: ['#e6fdff', '#3ae0ff', '#0a7ab0', '#03304a'], bg: '#04161e', men: 'rgba(220,255,255,.95)', part: 'spark' },
    sangue: { c: ['#c8303a', '#7a0812', '#40040a', '#180204'], bg: '#160408', men: 'rgba(255,120,120,.7)', part: 'bubble' },
    furia: { c: ['#ffb040', '#e04a10', '#7a1a04', '#2a0802'], bg: '#1e0a04', men: 'rgba(255,200,120,.85)', part: 'ember' },
    odio: { c: ['#c070ff', '#6a1aa8', '#2e0856', '#12021e'], bg: '#10041a', men: 'rgba(220,170,255,.8)', part: 'ember' },
    fe: { c: ['#fff6d0', '#ffd860', '#c89020', '#5a3a08'], bg: '#1e1606', men: 'rgba(255,250,220,.95)', part: 'mote' },
  };
  let style = 'mana';
  function draw(c: HTMLCanvasElement, q: Liquid, frac: number, kind: 'hp' | 'mp', dt: number, hit: number) {
    const g = c.getContext('2d')!, W = c.width, H = c.height, R = W / 2 - 3, cx = W / 2, cy = H / 2;
    // física do líquido: nível com mola (sobe/desce suave) e onda lateral que balança ao levar dano
    q.vel += (frac - q.level) * 18 * dt; q.vel *= Math.exp(-dt * 5); q.level += q.vel * dt; q.level = Math.max(0, Math.min(1, q.level)); if (frac <= 0) { q.level = Math.max(0, Math.min(q.level, q.level - dt * 4)); q.vel = Math.min(0, q.vel); } /* morto é zero: o globo esvazia de vez, sem a mola deixar um resto */
    q.wVel += -q.wave * 40 * dt + hit * 6; q.wVel *= Math.exp(-dt * 3.5); q.wave += q.wVel * dt;
    g.clearRect(0, 0, W, H);
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.clip();
    // fundo da esfera (vidro escuro)
    const bg = g.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R); const P = PAL[style] ?? PAL.mana; bg.addColorStop(0, kind === 'hp' ? '#2a1016' : P.bg); bg.addColorStop(1, '#05030a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // superfície do líquido
    const yL = cy + R - q.level * 2 * R, amp = 2 + Math.abs(q.wave) * 20 + (kind === 'mp' ? 1.2 : 0.6);
    const surf = (x: number) => yL + Math.sin(x / W * 6.283 * 1.5 + t * (kind === 'hp' ? 2.2 : 3.4)) * amp * 0.5 + Math.sin(x / W * 6.283 * 0.9 - t * 1.6) * amp * 0.4 + q.wave * (x - cx) * 0.9;
    const empty = frac <= 0 && q.level < 0.02; if (empty) q.wave = 0;
    g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 2) g.lineTo(x, empty ? H + 4 : surf(x)); g.lineTo(W, H); g.closePath();
    const lg = g.createLinearGradient(0, yL - 10, 0, cy + R);
    if (kind === 'hp') { lg.addColorStop(0, '#ff5a46'); lg.addColorStop(0.25, '#c81e1c'); lg.addColorStop(0.7, '#7a0a10'); lg.addColorStop(1, '#3a0408'); }
    else { lg.addColorStop(0, P.c[0]); lg.addColorStop(0.3, P.c[1]); lg.addColorStop(0.75, P.c[2]); lg.addColorStop(1, P.c[3]); }
    g.fillStyle = lg; g.fill();
    // volume: sombra interna nas bordas e luz lateral
    const inner = g.createRadialGradient(cx, cy, R * 0.55, cx, cy, R); inner.addColorStop(0, 'rgba(0,0,0,0)'); inner.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = inner; g.fillRect(0, 0, W, H);
    // menisco / brilho na superfície
    if (!empty) { g.beginPath(); for (let x = 0; x <= W; x += 2) { const y = surf(x); if (x === 0) g.moveTo(x, y); else g.lineTo(x, y); } g.strokeStyle = kind === 'hp' ? 'rgba(255,170,150,.75)' : P.men; g.lineWidth = 1.5; g.stroke(); }
    // bolhas (magia) / gotas escorrendo (sangue)
    if (kind === 'mp' && P.part !== 'bubble') { // brasas sobem e estalam (Ímpeto/Fúria/Ódio), faíscas correm (Energia), luzes flutuam (Fé)
      if (Math.random() < dt * (P.part === 'spark' ? 10 : 9) && q.level > 0.05) q.bubbles.push({ x: cx + (Math.random() - 0.5) * R * 1.4, y: cy + R - 4, r: 0.8 + Math.random() * 1.6, v: (P.part === 'mote' ? 10 : 22) + Math.random() * 26 });
      for (let i = q.bubbles.length - 1; i >= 0; i--) { const b = q.bubbles[i]; b.y -= b.v * dt; b.x += Math.sin(t * 5 + i * 1.7) * (P.part === 'spark' ? 22 : 8) * dt; if (b.y < surf(b.x) - (P.part === 'ember' ? 14 : 2)) { q.bubbles.splice(i, 1); continue; }
        g.beginPath(); g.arc(b.x, b.y, b.r, 0, 6.283); g.fillStyle = P.part === 'spark' ? 'rgba(230,255,255,.95)' : P.part === 'mote' ? 'rgba(255,250,220,.9)' : `rgba(255,${160 + Math.floor(Math.random() * 80)},80,.95)`; g.fill(); }
      if (P.part === 'spark' && Math.random() < dt * 3 && q.level > 0.1) { g.beginPath(); let x = cx - R * 0.6, y = cy + R * 0.3 - Math.random() * R * 0.6; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += R * 0.22; y += (Math.random() - 0.5) * 14; g.lineTo(x, y); } g.strokeStyle = 'rgba(220,255,255,.9)'; g.lineWidth = 1.4; g.stroke(); }
      if (P.part === 'ember') { const gl = g.createRadialGradient(cx, cy + R, 2, cx, cy + R, R * 1.2); gl.addColorStop(0, `rgba(255,140,40,${0.25 + 0.1 * Math.sin(t * 6)})`); gl.addColorStop(1, 'rgba(255,80,20,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H); }
    } else if (kind === 'mp') {
      if (Math.random() < dt * 6 && q.level > 0.08) q.bubbles.push({ x: cx + (Math.random() - 0.5) * R * 1.4, y: cy + R - 4, r: 1 + Math.random() * 2.2, v: 14 + Math.random() * 20 });
      for (let i = q.bubbles.length - 1; i >= 0; i--) { const b = q.bubbles[i]; b.y -= b.v * dt; b.x += Math.sin(t * 3 + i) * 6 * dt; if (b.y < surf(b.x) + 2) { q.bubbles.splice(i, 1); continue; } g.beginPath(); g.arc(b.x, b.y, b.r, 0, 6.283); g.strokeStyle = 'rgba(190,230,255,.7)'; g.lineWidth = 1; g.stroke(); }
    } else {
      if (hit > 0.2 && Math.random() < 0.6) for (let k = 0; k < 3; k++) q.drips.push({ x: cx + (Math.random() - 0.5) * R * 1.6, y: yL - 6 - Math.random() * 20, v: 10 + Math.random() * 25, r: 1 + Math.random() * 1.6 });
      for (let i = q.drips.length - 1; i >= 0; i--) { const dr = q.drips[i]; dr.y += dr.v * dt; dr.v += 60 * dt; if (dr.y > surf(dr.x)) { q.drips.splice(i, 1); continue; } g.beginPath(); g.ellipse(dr.x, dr.y, dr.r, dr.r * 1.8, 0, 0, 6.283); g.fillStyle = '#b01818'; g.fill(); }
      // película escorrendo no vidro acima do nível
      g.globalAlpha = 0.25; g.fillStyle = '#5a0a10'; for (let k = 0; k < 5; k++) { const x = cx + Math.sin(k * 2.1 + 0.5) * R * 0.7, h = 10 + ((k * 37 + Math.floor(t * 0.3)) % 25); g.fillRect(x - 1, Math.max(yL - h, cy - R), 2, h); } g.globalAlpha = 1;
    }
    // reflexo do vidro
    const hl = g.createRadialGradient(cx - R * 0.35, cy - R * 0.45, 2, cx - R * 0.35, cy - R * 0.45, R * 0.6); hl.addColorStop(0, 'rgba(255,255,255,.55)'); hl.addColorStop(0.4, 'rgba(255,255,255,.12)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = hl; g.fillRect(0, 0, W, H);
    g.beginPath(); g.ellipse(cx + R * 0.3, cy + R * 0.55, R * 0.35, R * 0.12, 0.5, 0, 6.283); g.fillStyle = 'rgba(255,255,255,.08)'; g.fill();
    // brilho de impacto
    if (hit > 0) { g.fillStyle = `rgba(255,255,255,${hit * 0.25})`; g.fillRect(0, 0, W, H); }
    g.restore();
  }
  let hitHp = 0, hitMp = 0, lastHp = -1, lastMp = -1;
  function update(dt: number, hp: number, hpMax: number, mp: number, mpMax: number) {
    t += dt;
    if (lastHp >= 0 && hp < lastHp - 0.5) hitHp = Math.min(1, hitHp + (lastHp - hp) / Math.max(1, hpMax) * 4 + 0.15); if (lastMp >= 0 && mp < lastMp - 0.5) hitMp = Math.min(1, hitMp + 0.3);
    lastHp = hp; lastMp = mp; hitHp *= Math.exp(-dt * 4); hitMp *= Math.exp(-dt * 4);
    draw(hpC, L.hp, hpMax > 0 ? hp / hpMax : 1, 'hp', dt, hitHp); draw(mpC, L.mp, mpMax > 0 ? mp / mpMax : 1, 'mp', dt, hitMp);
  }
  return { update, setStyle(st: string) { style = st; L.mp.bubbles.length = 0; } };
}

/** O Olho Kármico: pupila segue o mouse/ação, pisca, enche de karma (nunca por completo) e transborda numa lágrima em atos heroicos. */
export function createEye() {
  const eye = document.getElementById('eye') as unknown as SVGSVGElement;
  const pup = eye.querySelector('.pup') as SVGPolygonElement;
  const svgNS = 'http://www.w3.org/2000/svg';
  // íris brilhante atrás da pupila e lágrima
  // íris dourada como a do despertar: gradiente radial, brilho de reflexo; a pupila losango fica por cima
  const defs = eye.querySelector('defs') ?? eye.insertBefore(document.createElementNS(svgNS, 'defs'), eye.firstChild);
  defs.insertAdjacentHTML('beforeend', '<radialGradient id="hudIris" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff0bd"/><stop offset=".6" stop-color="#f2b04a"/><stop offset="1" stop-color="#7a4a10"/></radialGradient>');
  const iris = document.createElementNS(svgNS, 'g'); iris.setAttribute('class', 'iris'); iris.setAttribute('clip-path', 'url(#lozc)');
  iris.innerHTML = '<g class="irisball"><ellipse cx="150" cy="110" rx="30" ry="30" fill="url(#hudIris)" stroke="#5a3408" stroke-width="2"/><ellipse cx="150" cy="110" rx="21" ry="21" fill="none" stroke="rgba(122,74,16,.45)" stroke-width="1.5"/></g><ellipse class="glint" cx="140" cy="100" rx="5.5" ry="3.5" fill="rgba(255,255,255,.8)"/>';
  pup.parentNode!.insertBefore(iris, pup); pup.setAttribute('points', '150,95 159,110 150,125 141,110'); pup.setAttribute('stroke', '#3a2006'); pup.setAttribute('stroke-width', '1.5');
  const ball = iris.querySelector('.irisball') as SVGGElement, glint = iris.querySelector('.glint') as SVGEllipseElement;
  const tear = document.createElementNS(svgNS, 'path'); tear.setAttribute('d', 'M150 168 q-9 14 0 22 q9 -8 0 -22 z'); tear.setAttribute('fill', '#fff0bd'); tear.setAttribute('class', 'tear'); tear.style.opacity = '0'; eye.appendChild(tear);
  const lidTop = document.createElementNS(svgNS, 'polygon'); lidTop.setAttribute('points', '60,110 143,54 157,54 240,110'); lidTop.setAttribute('fill', '#0b0810'); lidTop.setAttribute('class', 'lid'); lidTop.style.transformOrigin = '150px 110px'; lidTop.style.transform = 'scaleY(0)'; eye.appendChild(lidTop);
  const lidBot = document.createElementNS(svgNS, 'polygon'); lidBot.setAttribute('points', '60,110 143,166 157,166 240,110'); lidBot.setAttribute('fill', '#0b0810'); lidBot.setAttribute('class', 'lid'); lidBot.style.transformOrigin = '150px 110px'; lidBot.style.transform = 'scaleY(0)'; eye.appendChild(lidBot);
  let lookX = 0, lookY = 0, tx = 0, ty = 0, blinkT = 3 + Math.random() * 4, blink = 0, blink2 = false, overflow = 0, tearT = 0, shown = 0;
  let fixT = 0, dil = 1, idleX = 0, idleY = 0;
  /** gaze: para onde olhar, em coordenadas da tela (-1..1, centro = herói), e por quê.
   *  O Olho não fica seguindo o mouse feito doido: ele se FIXA num ponto (meio segundo a um segundo e meio) e salta
   *  rápido para o próximo, como um olho de verdade. Ameaça: crava no inimigo e a pupila aperta. Andando: olha para onde
   *  o herói vai. Parado: passeia pelo mundo, às vezes olha você (o centro), às vezes um NPC, às vezes o mouse. */
  function update(dt: number, gaze: { x: number; y: number; kind: 'threat' | 'mouse' | 'move' | 'npc' } | null, acting: boolean, karma: number, sealed = false, night = 0) {
    eye.classList.toggle('sealed', sealed);
    if (sealed) { // antes do nível 20 o Olho dorme: pálpebras fechadas, sem líquido, sem pupila
      lidTop.style.transform = 'scaleY(1)'; lidBot.style.transform = 'scaleY(1)'; iris.style.opacity = '0'; pup.style.opacity = '0'; shown += (0 - shown) * Math.min(1, dt * 2); eye.style.setProperty('--k', String(shown)); eye.classList.remove('over'); return; }
    fixT -= dt;
    if (gaze && (gaze.kind === 'threat' || fixT <= 0)) { tx = gaze.x; ty = gaze.y; fixT = gaze.kind === 'threat' ? 0.15 : 0.5 + Math.random() * 0.8; }
    else if (!gaze && fixT <= 0) { /* parado e sem nada: passeia o olhar, e volta ao centro de vez em quando */
      const r = Math.random(); if (r < 0.35) { idleX = 0; idleY = 0; } else { idleX = (Math.random() - 0.5) * 1.6; idleY = (Math.random() - 0.5) * 0.9; } tx = idleX; ty = idleY; fixT = 0.9 + Math.random() * 2.2; }
    /* o olhar cabe na amêndoa: elipse achatada (mais curso para os lados, pouco para cima/baixo) */
    let gx = Math.max(-1, Math.min(1, tx)), gy = Math.max(-1, Math.min(1, ty)); const m = Math.hypot(gx, gy * 1.3); if (m > 1) { gx /= m; gy /= m; }
    const sp = Math.min(1, dt * 16); lookX += (gx - lookX) * sp; lookY += (gy - lookY) * sp; /* sacada: rápido, e para */
    const trem = Math.sin(performance.now() / 97) * 0.012; /* micro-tremor de olho vivo */
    const wantDil = (gaze?.kind === 'threat' ? 0.72 : acting ? 0.8 : 1) * (1 + night * 0.25); dil += (wantDil - dil) * Math.min(1, dt * 4);
    const ix = (lookX + trem) * 22, iy = lookY * 9;
    iris.style.transformOrigin = '150px 110px'; ball.style.transformOrigin = '150px 110px';
    ball.style.transform = `translate(${ix}px, ${iy}px) scale(${1 - Math.abs(lookX) * 0.1}, 1)`; /* a íris achata um pouco quando olha para o lado (é uma esfera) */
    ball.style.transformBox = 'view-box'; glint.style.transform = `translate(${ix * 0.85}px, ${iy * 0.85}px)`;
    /* a pupila gira e escala em volta do CENTRO do Olho (view-box): com fill-box a origem 150,110 caía fora do losango e a pupila escorregava para fora da íris ao dilatar */
    const pulse = eye.classList.contains('full') ? 1 + Math.sin(performance.now() / 510) * 0.08 : 1;
    pup.style.transformBox = 'view-box'; pup.style.transformOrigin = '150px 110px'; pup.style.transform = `translate(${ix}px, ${iy}px) scale(${dil * pulse * (1 - Math.abs(lookX) * 0.1)}, ${dil * pulse})`;
    // piscar (às vezes duas seguidas); assustado pisca menos
    blinkT -= dt; if (blinkT <= 0) { blink = 0.2; blink2 = Math.random() < 0.18; blinkT = (gaze?.kind === 'threat' ? 6 : 2.8) + Math.random() * 4.5; }
    if (blink > 0) { blink -= dt; const k = Math.sin(Math.max(0, blink) / 0.2 * Math.PI); lidTop.style.transform = `scaleY(${k})`; lidBot.style.transform = `scaleY(${k * 0.85})`; const vis = k > 0.6 ? '0' : String(1 - k / 0.6); iris.style.opacity = vis; pup.style.opacity = vis; if (blink <= 0 && blink2) { blink2 = false; blinkT = 0.12; } }
    else { lidTop.style.transform = 'scaleY(0)'; lidBot.style.transform = 'scaleY(0)'; iris.style.opacity = '1'; pup.style.opacity = '1'; }
    // nível: karma 0..100 → 0..0.9 (nunca enche); transbordo só em ato heroico
    const target = overflow > 0 ? 1.0 : Math.min(0.9, karma / 100 * 0.9);
    shown += (target - shown) * Math.min(1, dt * (overflow > 0 ? 3 : 0.8));
    eye.style.setProperty('--k', String(shown));
    if (overflow > 0) { overflow -= dt; if (overflow < 2.4 && tearT === 0) tearT = 0.01; }
    if (tearT > 0) { tearT += dt; const p = Math.min(1, tearT / 2.2); tear.style.opacity = String(p < 0.9 ? 1 : (1 - p) * 10); tear.style.transform = `translateY(${p * 40}px) scale(${1 + p * 0.3})`; if (tearT > 2.6) { tearT = 0; tear.style.opacity = '0'; } }
    eye.classList.toggle('over', overflow > 0);
  }
  /** ato heroico: o olho enche de vez e transborda numa lágrima (3,5 s) */
  function heroic() { overflow = 3.5; tearT = 0; }
  return { update, heroic };
}

/** Nível 20: cena do Olho Kármico se abrindo em tela cheia e descendo até o centro da barra. */
/* O despertar (nível 20): o Olho se abre na tela, sobe o letreiro de Marghar (a história do karma) e,
   no fim, o Olho revela as escolhas que guardou em silêncio enquanto dormia — e cobra. */
export const MARGHAR_CRAWL = [
  ['h', 'O Olho Kármico se abre'],
  ['p', 'Antes dos reinos, antes dos deuses que vocês nomeiam nas tavernas, havia só o Caminho. E no Caminho andava <b>Marghar</b>, o dos Caminhos, que não tem trono nem templo, porque toda estrada é a casa dele.'],
  ['p', 'Marghar não cria as almas. Ele as <i>vê</i>. Cada passo que um vivo dá deixa uma marca no Caminho, e Marghar guarda cada marca como quem guarda sementes.'],
  ['q', 'Marghar não julga. Ele vê, e guarda. Mas ele cobra… Ele se lembra.'],
  ['p', 'Enquanto você vive e escolhe, o seu karma é <b>líquido</b>: enche o Olho devagar, ato após ato. Nunca enche por completo. O que transborda é a <b>Lágrima</b>, e só nasce de feitos que o mundo não esquece.'],
  ['p', 'Quando você morre, o líquido vira <b>areia</b> e escorre na Ampulheta. Você desencarna, e volta. Humano outra vez, sem memória — mas não sem marca. A sede de sangue de um vampiro, o medo de prata, o nome sussurrado pelos profetas: o que você foi atravessa a areia.'],
  ['p', 'O <b>Sem-Passo</b> é o que se recusa ao Caminho: a alma que quer parar o tempo, comprar o perdão, apagar a marca. Os príncipes infernais servem a ele, e oferecem tesouros a quem aceita não ter passado.'],
  ['p', 'Não existe escolha errada aos olhos de Marghar. Existe a escolha, e o <i>motivo</i> dela. Poupar por piedade e poupar por medo são o mesmo gesto, e pesos opostos.'],
  ['p', 'Até hoje o seu Olho dormia. Não porque Marghar não olhava — mas porque você ainda não sabia que era visto.'],
  ['q', 'Agora sabe.'],
] as const;
export function playAwakening(name: string, sealed: { title: string; delta: number }[], done: () => void) {
  const el = document.createElement('div'); el.id = 'awaken'; el.classList.add('crawlmode');
  const sum = sealed.reduce((a, e) => a + e.delta, 0);
  const crawl = MARGHAR_CRAWL.map(([k, t]) => k === 'h' ? `<h1>${t}</h1>` : k === 'q' ? `<p class="q">${t}</p>` : `<p>${t}</p>`).join('');
  const memo = sealed.length ? `<div class="memo"><h2>O Olho se lembra</h2><p>Enquanto dormia, ele guardou ${sealed.length === 1 ? 'uma escolha sua' : `${sealed.length} escolhas suas`}:</p>${sealed.map((e) => `<div class="me ${e.delta > 0 ? 'l' : e.delta < 0 ? 'd' : ''}"><span>${e.title}</span><b>${e.delta > 0 ? '+' : ''}${e.delta}</b></div>`).join('')}<p class="kd" style="color:${sum > 0 ? '#9ad7ff' : sum < 0 ? '#ff8a7a' : '#d9c08a'}">Karma cobrado agora: ${sum > 0 ? '+' : ''}${sum}</p></div>` : `<div class="memo"><h2>O Olho se lembra</h2><p>Nenhuma escolha pesada ficou guardada. O seu Caminho começa limpo — por enquanto.</p></div>`;
  el.innerHTML = `<div class="rays"></div><svg class="bigeye" viewBox="20 30 260 160">
    <defs><clipPath id="bigc"><polygon points="60,110 143,54 157,54 240,110 157,166 143,166"/></clipPath><radialGradient id="bgl" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff0bd"/><stop offset=".6" stop-color="#f2b04a"/><stop offset="1" stop-color="#7a4a10"/></radialGradient></defs>
    <polygon points="60,110 143,54 157,54 240,110 157,166 143,166" fill="#0b0810"/>
    <g clip-path="url(#bigc)"><ellipse class="biris" cx="150" cy="110" rx="46" ry="46" fill="url(#bgl)"/><polygon class="bpup" points="150,86 174,110 150,134 126,110" fill="#0b0810"/><ellipse cx="136" cy="96" rx="8" ry="5" fill="rgba(255,255,255,.7)"/></g>
    <g fill="none" stroke="#d9a24f" stroke-width="14" stroke-linejoin="bevel"><path d="M144 40 L40 110 L144 180"/><path d="M40 40 L40 180"/><path d="M156 40 L260 110 L156 180"/><path d="M260 40 L260 180"/></g>
    <polygon class="lidt" points="60,110 143,54 157,54 240,110" fill="#0b0810"/><polygon class="lidb" points="60,110 143,166 157,166 240,110" fill="#0b0810"/>
  </svg><div class="crawlwin"><div class="crawl"><p class="who">Karmika agora vê você, <b>${name}</b>.</p>${crawl}${memo}</div></div><button class="aw-go">Aceitar o Olho</button><small class="aw-skip">Espaço: acelerar</small>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('on'));
  setTimeout(() => el.classList.add('open'), 1400);
  setTimeout(() => el.classList.add('lift'), 3600); // o Olho sobe e o letreiro começa
  const cr = el.querySelector('.crawl') as HTMLElement, win = el.querySelector('.crawlwin') as HTMLElement; let y = 0, fast = false, last = performance.now(), live = true;
  const key = (e: KeyboardEvent) => { if (e.key === ' ') { fast = e.type === 'keydown'; e.preventDefault(); } };
  addEventListener('keydown', key); addEventListener('keyup', key);
  const tick = (now: number) => { if (!live) return; const dt = Math.min(0.25, (now - last) / 1000); last = now;
    if (el.classList.contains('lift')) { const max = cr.offsetHeight + win.clientHeight * 0.06; /* sobe até o fim do texto chegar perto do alto da janela (antes parava no meio e a leitura empacava) */ if (y < max) y = Math.min(max, y + dt * (fast ? 180 : 34)); else el.classList.add('ready'); cr.style.transform = `translateY(${win.clientHeight - y}px)`; if (y === 0) cr.style.transform = `translateY(${win.clientHeight}px)`; }
    requestAnimationFrame(tick); };
  // o letreiro parte de baixo da janela e sobe até o fim (o resumo das escolhas fica no alto)
  requestAnimationFrame(tick);
  (el.querySelector('.aw-go') as HTMLElement).onclick = () => { live = false; removeEventListener('keydown', key); removeEventListener('keyup', key); el.classList.add('down'); setTimeout(() => { el.classList.add('off'); done(); }, 1200); setTimeout(() => el.remove(), 2200); };
}

/** Morte (após o Olho aberto): o Olho surge na tela, vira como ampulheta, fecha, desce e se recolhe ao centro da barra; depois o jogador renasce. */
export function playDeath(name: string, home: string, done: () => void, o: { title?: string; sub?: string } = {}) {
  /* a Ampulheta É o Olho de pé: o mesmo símbolo (os dois Ks), na mesma proporção, gira em torno de si e fica vertical;
     o ouro vira violeta, e o Olho dá lugar à Ampulheta da Bíblia (o K de pé), com a areia caindo pelo bico de baixo */
  const el = document.createElement('div'); el.id = 'awaken'; el.classList.add('death');
  const HEX = '60,110 143,54 157,54 240,110 157,166 143,166';
  el.innerHTML = `<div class="rays"></div><svg class="bigeye" viewBox="20 30 260 160">
    <defs><clipPath id="bigd"><polygon points="${HEX}"/></clipPath><radialGradient id="bgd" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff0bd"/><stop offset=".6" stop-color="#f2b04a"/><stop offset="1" stop-color="#7a4a10"/></radialGradient>
      <linearGradient id="bsand" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff2c8"/><stop offset="1" stop-color="#e8b85a"/></linearGradient></defs>
    <polygon points="${HEX}" fill="#0b0810"/>
    <g clip-path="url(#bigd)"><g class="eyein"><ellipse class="biris" cx="150" cy="110" rx="46" ry="46" fill="url(#bgd)"/><polygon class="bpup" points="150,86 174,110 150,134 126,110" fill="#0b0810"/><ellipse cx="136" cy="96" rx="8" ry="5" fill="rgba(255,255,255,.7)"/></g>
</g>
    <g class="kk" fill="none" stroke="#d9a24f" stroke-width="14" stroke-linejoin="bevel"><path d="M144 40 L40 110 L144 180"/><path d="M40 40 L40 180"/><path d="M156 40 L260 110 L156 180"/><path d="M260 40 L260 180"/></g>
  </svg><svg class="bhour" viewBox="410 30 180 310" aria-label="A Ampulheta: o K de pé, a areia cai pelo bico de baixo">
    <defs><clipPath id="bhv"><polygon points="500,60 556,143 556,157 501,242 501,252 499,252 499,242 444,157 444,143"/></clipPath></defs>
    <g clip-path="url(#bhv)"><g transform="translate(0,120)"><animateTransform attributeName="transform" type="translate" values="0 120;0 215" dur="4.6s" fill="freeze" begin="indefinite" class="hsand"/>
      <path fill="#cfa766" d="M340 40 L478 40 L500 54 L522 40 L660 40 L660 700 L340 700 Z"/></g></g>
    <g fill="none" stroke="#8f7bff" stroke-width="14" stroke-linecap="butt" stroke-linejoin="bevel">
      <path d="M570 144 L500 40 L430 144"/><path d="M430 40 L570 40"/><path d="M570 156 L512.1 242"/><path d="M430 156 L487.9 242"/><path d="M430 260 L493 260"/><path d="M507 260 L570 260"/></g>
    <line x1="500" y1="246" x2="500" y2="318" stroke="#cfa766" stroke-width="3" stroke-dasharray="2 5"><animate attributeName="stroke-dashoffset" from="0" to="-7" dur="0.35s" repeatCount="indefinite"/></line>
    <polygon points="492,320 508,320 500,316" fill="#cfa766"><animate attributeName="points" values="492,320 508,320 500,316;466,320 534,320 500,294" dur="4.6s" fill="freeze" begin="indefinite" class="hpile"/></polygon>
    <line x1="440" y1="322" x2="560" y2="322" stroke="#8f7bff" stroke-width="2" opacity="0.5"/></svg><div class="txt"><h1>${o.title ?? 'Você cai'}</h1><p>${o.sub ?? `O Olho guarda o que viu, <b>${name}</b>. A areia corre de novo.`}</p><small>Renascendo na fonte de ${home}…</small></div>`;
  document.body.appendChild(el);
  /* a Ampulheta da Bíblia: a areia de cima desce e cai pelo bico de baixo, fazendo o monte */
  const sand = () => { for (const an of Array.from(el.querySelectorAll('.hsand, .hpile'))) (an as SVGAnimationElement).beginElement(); }; let raf = 0;
  requestAnimationFrame(() => { el.classList.add('on'); el.classList.add('open'); });
  setTimeout(() => el.classList.add('turn'), 700);   // o Olho gira em torno de si e fica de pé: é a Ampulheta
  setTimeout(() => { el.classList.add('sanding'); sand(); }, 1700);
  setTimeout(() => el.classList.add('text'), 1500);
  setTimeout(() => el.classList.add('down'), 4300);  // desce e se recolhe ao centro da barra
  setTimeout(() => { el.classList.add('off'); void raf; done(); }, 5300);
  setTimeout(() => el.remove(), 6300);
}
