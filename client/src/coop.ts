/* Painel "Jogar junto": abrir a sala nesta máquina (só no app instalado) ou entrar com um convite. */
import { inviteOf, NET_PORT, passFor, savePass, type Net, type NetProfile } from './net';

interface HostInfo { port: number; code: string; publicIp: string | null; upnp: { ok: boolean; external?: string | null; why?: string }; cgnat: boolean | null; lan: { ip: string; name: string; kind: 'lan' | 'tailscale' | 'radmin' }[]; players: unknown[] }
interface Desktop { isDesktop: true; host(o?: { port?: number; password?: string }): Promise<HostInfo>; hostInfo(): Promise<HostInfo | null>; stopHost(): Promise<boolean>; gpu(): Promise<{ renderer: string | null; vendor: string | null; device: string | null } | null>; copy(t: string): Promise<boolean>; open(u: string): Promise<boolean> }
const desk = (window as unknown as { karmikaDesktop?: Desktop }).karmikaDesktop ?? null;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export function createCoop(net: Net, hooks: { whisperTo(name: string): void; myHp(): number; mailTo?(name: string): void; duel?(id: number): void; toMenu?(): void; pvpToggle?(): void; pvpOn?(): boolean }) {
  const el = document.createElement('div'); el.id = 'coop'; el.className = 'modalw'; document.body.appendChild(el);
  let open = false, hosting: HostInfo | null = null, busy = false, gpu = '', hostErr = '';
  const LS = 'karmika.coop.last';
  let lastInv = ''; try { lastInv = localStorage.getItem(LS) || ''; } catch { /* */ }
  if (desk) desk.gpu().then((g) => { if (g) { gpu = g.renderer || [g.vendor, g.device].filter(Boolean).join(' '); if (open) render(); } }).catch(() => { /* */ });

  async function copy(t: string) { try { if (desk) await desk.copy(t); else await navigator.clipboard.writeText(t); return true; } catch { return false; } }

  function hostBlock(): string {
    if (!desk) return `<div class="cp-box"><h3>Abrir uma sala</h3><p class="cp-mut">Para abrir a sala na sua máquina, use o <b>app do Karmika</b> (instalado). No navegador dá para <b>entrar</b> numa sala, mas não para abrir uma.</p></div>`;
    if (!hosting) return `<div class="cp-box"><h3>Abrir uma sala nesta máquina</h3><p class="cp-mut">Sua máquina vira o servidor. Até 6 Caminhantes; cada um traz o próprio personagem e o próprio save.</p><div class="cp-join" style="margin-bottom:8px"><input data-i="hpass" type="password" placeholder="Senha da sala (opcional)"></div><button class="cp-btn gold" data-a="host" ${busy ? 'disabled' : ''}>${busy ? 'Abrindo a sala… (testando o roteador)' : '✧ Abrir servidor'}</button>${hostErr ? `<p class="cp-bad">✖ ${esc(hostErr)}</p>` : ''}</div>`;
    const H = hosting, pubInv = H.publicIp ? inviteOf(H.publicIp, H.port, H.code) : null;
    const ts = H.lan.find((a) => a.kind === 'tailscale'), rad = H.lan.find((a) => a.kind === 'radmin'), lan = H.lan.find((a) => a.kind === 'lan');
    let status = '';
    if (H.upnp.ok && H.cgnat === false) status = `<p class="cp-ok">✔ O roteador abriu a porta ${H.port} sozinho. Mande o convite abaixo para os amigos.</p>`;
    else if (H.cgnat) status = `<p class="cp-bad">✖ Sua operadora usa <b>CGNAT</b>: o seu IP de internet é dividido com outros clientes, e ninguém de fora consegue chegar até a sua máquina pelo convite público.</p><p class="cp-mut"><b>Plano B (grátis, 2 min):</b> instale o <a data-u="https://tailscale.com/download">Tailscale</a> em todas as máquinas, entre com a mesma conta (ou convide os amigos para a sua rede), e use o convite do Tailscale que aparece aqui.</p>`;
    else status = `<p class="cp-warn">⚠ O roteador não abriu a porta sozinho (${esc(H.upnp.why || 'sem UPnP')}). Duas saídas: ligue o <b>UPnP</b> no roteador e reabra a sala, ou faça um <b>redirecionamento da porta ${H.port} (TCP)</b> para ${esc(lan?.ip || 'esta máquina')}. Se nada der certo, use o <a data-u="https://tailscale.com/download">Tailscale</a>.</p>`;
    const row = (label: string, inv: string, hint: string) => `<div class="cp-inv"><small>${label}</small><code>${esc(inv)}</code><button class="cp-btn" data-copy="${esc(inv)}">Copiar</button><em>${hint}</em></div>`;
    return `<div class="cp-box host"><h3>✧ Sua sala está aberta · código <b>${esc(H.code)}</b>${(H as HostInfo & { pass?: boolean }).pass ? ' · 🔒 com senha' : ''}</h3>${status}
      ${pubInv && !H.cgnat ? row('Convite pela internet', pubInv, 'para os amigos em casa') : ''}
      ${ts ? row('Convite pelo Tailscale', inviteOf(ts.ip, H.port, H.code), 'quem estiver na sua rede Tailscale') : ''}
      ${rad ? row('Convite pelo Radmin VPN', inviteOf(rad.ip, H.port, H.code), 'quem estiver na sua rede Radmin') : ''}
      ${lan ? row('Convite na mesma casa (Wi-Fi)', inviteOf(lan.ip, H.port, H.code), 'quem estiver no mesmo roteador') : ''}
      <p class="cp-mut">Na primeira vez, o Windows pergunta se o Karmika pode usar a rede: marque <b>Redes privadas e públicas</b> e permita.</p>
      <button class="cp-btn red" data-a="stop">Fechar a sala</button></div>`;
  }
  function render() {
    if (!open) return;
    const st = net.state, peers = st === 'on' ? net.peers() : [];
    const zoneTxt = (z: string) => z === 'world' ? 'no mundo' : z.startsWith('crypt:') ? `Catedral, andar ${z.slice(6)}` : 'dentro de uma casa';
    el.innerHTML = `<div class="pn coop"><h2>✧ Jogar junto <button data-x>✕</button></h2>
      ${gpu ? `<p class="cp-gpu">Placa de vídeo em uso: <b>${esc(gpu)}</b></p>` : ''}
      ${hostBlock()}
      <div class="cp-box"><h3>${st === 'on' ? `Na sala ${esc(net.code)} · ${peers.length} Caminhante${peers.length > 1 ? 's' : ''}` : st === 'connecting' ? 'Entrando…' : 'Entrar numa sala'}</h3>
        ${st === 'on' ? `<ul class="cp-peers">${peers.map((p) => `<li class="${p.me ? 'me' : ''}"><b>${p.host ? '👑 ' : ''}${esc(p.name)}</b><span>Nv ${p.lvl} · ${esc(p.cls)}</span><i>${p.me ? `você · ${net.ping} ms` : zoneTxt(p.zn)}</i></li>`).join('')}</ul>
          <p class="cp-mut">Converse pelo chat (Enter). Ctrl + clique num jogador: grupo, carta, perfil, duelo.</p><div class="cp-pvp"><button class="cp-btn ${hooks.pvpOn?.() ? 'red' : ''}" data-a="pvp">${hooks.pvpOn?.() ? '⚔ PvP da facção: LIGADO' : '🕊 PvP da facção: desligado'}</button><p class="cp-mut">Facções diferentes podem se atacar fora das vilas. Ligado, você também fere quem é do seu lado (ou não jurou lado): nome vermelho e perda de karma.</p></div><button class="cp-btn red" data-a="leave">Sair da sala</button>`
        : `<p class="cp-mut">Cole o convite que o anfitrião mandou:</p><div class="cp-join"><input data-i="inv" placeholder="karmika://IP:${NET_PORT}/CÓDIGO" value="${esc(lastInv)}" spellcheck="false"><input data-i="jpass" type="password" placeholder="senha" style="flex:0 0 110px" value="${esc(passFor(lastInv))}"><button class="cp-btn gold" data-a="join" ${st === 'connecting' ? 'disabled' : ''}>Entrar</button></div>`}
      </div>
      <label class="cp-opt"><input type="checkbox" data-o="noParty" ${noParty() ? 'checked' : ''}> Recusar convites de grupo automaticamente</label>
      <p class="cp-mut">Dica: <b>Ctrl + clique</b> em outro jogador abre o menu dele (mensagem privada, convite de grupo, perfil).</p></div>`;
  }
  function toggle(on = !open) { open = on; el.style.display = open ? 'flex' : 'none'; if (open) { if (desk) desk.hostInfo().then((h) => { hosting = h; render(); }).catch(() => { /* */ }); render(); } }
  el.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-x]') || t === el) { toggle(false); return; }
    const u = t.closest('[data-u]') as HTMLElement | null; if (u) { e.preventDefault(); const url = u.dataset.u!; if (desk) desk.open(url); else window.open(url, '_blank'); return; }
    const c = t.closest('[data-copy]') as HTMLElement | null; if (c) { const ok = await copy(c.dataset.copy!); c.textContent = ok ? 'Copiado ✔' : 'Copie à mão'; setTimeout(() => { if (c.isConnected) c.textContent = 'Copiar'; }, 1600); return; }
    const a = (t.closest('[data-a]') as HTMLElement | null)?.dataset.a; if (!a) return;
    if (a === 'host' && desk && !busy) {
      busy = true; hostErr = ''; render();
      try {
        const hp = (el.querySelector('[data-i="hpass"]') as HTMLInputElement | null)?.value || '';
        hosting = await desk.host({ port: NET_PORT, password: hp }); savePass(inviteOf('127.0.0.1', hosting.port, hosting.code), hp);
        net.connect(inviteOf('127.0.0.1', hosting.port, hosting.code)); // o anfitrião também é um jogador da própria sala
      } catch (err) { hosting = null; const m = String((err as Error)?.message || err); net.disconnect(true); hostErr = /EADDRINUSE/.test(m) ? `A porta ${NET_PORT} já está em uso (outra sala aberta?).` : 'Não deu para abrir a sala: ' + m; }
      busy = false; render();
    }
    if (a === 'stop' && desk) { net.disconnect(); await desk.stopHost(); hosting = null; render(); }
    if (a === 'join') { const v = (el.querySelector('[data-i="inv"]') as HTMLInputElement).value.trim(); lastInv = v; savePass(v, (el.querySelector('[data-i="jpass"]') as HTMLInputElement).value); try { localStorage.setItem(LS, v); } catch { /* */ } net.connect(v); render(); }
    if (a === 'pvp') { hooks.pvpToggle?.(); render(); return; }
    if (a === 'leave') { net.disconnect(); open = false; render(); hooks.toMenu?.(); } // saiu da sala: volta para a tela inicial (escolher outro servidor ou jogar sozinho)
  });
  el.addEventListener('change', (e) => { const t = e.target as HTMLInputElement; if (t.dataset.o === 'noParty') { try { localStorage.setItem(NP, t.checked ? '1' : '0'); } catch { /* */ } } });
  el.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' && (e.target as HTMLElement).matches('[data-i="inv"]')) (el.querySelector('[data-a="join"]') as HTMLElement)?.click(); if (e.key === 'Escape') toggle(false); });
  net.onChange(() => { render(); drawParty(); });

  /* ---------- menu do jogador (Ctrl + clique) ---------- */
  const NP = 'karmika.coop.noParty';
  function noParty() { try { return localStorage.getItem(NP) === '1'; } catch { return false; } }
  const menu = document.createElement('div'); menu.id = 'plmenu'; document.body.appendChild(menu);
  function playerMenu(id: number, x: number, y: number) {
    const inf = net.infoOf(id); if (!inf) return;
    const P = net.party, inMine = !!P && P.members.includes(id), lead = !!P && P.leader === net.myId;
    menu.innerHTML = `<div class="pm-h"><b>${esc(inf.name)}</b><small>Nv ${inf.lvl} · ${esc(inf.cls)}</small></div>
      <button data-m="w">✉ Mensagem privada</button>
      ${inMine ? (lead ? `<button data-m="lead">👑 Passar a liderança</button><button data-m="kick">✖ Remover do grupo</button>` : '') : `<button data-m="inv" ${inf.inParty ? 'disabled title="Já está em um grupo"' : ''}>⚑ Convidar para o grupo</button>`}
      <button data-m="prof">◎ Ver perfil</button>
      <button data-m="mail">📮 Enviar carta ou itens</button>
      <button data-m="duel">⚔ Desafiar para duelo</button>`;
    menu.style.display = 'block'; const z = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui')) || 1, w = 220 * z, h = menu.offsetHeight * z; menu.style.left = Math.min(innerWidth - w - 8, x + 8) / z + 'px'; menu.style.top = Math.min(innerHeight - h - 8, y + 8) / z + 'px'; menu.dataset.id = String(id); /* (o id ficava depois do comentário da linha, comentado junto: nenhum botão do menu funcionava) — o menu segue o tamanho da interface (zoom): posição em px da tela ÷ zoom */
  }
  menu.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('[data-m]') as HTMLButtonElement | null; if (!b || b.disabled) return; const id = +menu.dataset.id!; const inf = net.infoOf(id); menu.style.display = 'none'; if (!inf) return;
    if (b.dataset.m === 'w') hooks.whisperTo(inf.name);
    if (b.dataset.m === 'inv') net.inviteParty(id);
    if (b.dataset.m === 'kick') net.kick(id);
    if (b.dataset.m === 'lead') net.makeLeader(id);
    if (b.dataset.m === 'prof') { net.askProfile(id); showProfile(id, null); }
    if (b.dataset.m === 'mail') hooks.mailTo?.(inf.name);
    if (b.dataset.m === 'duel') hooks.duel?.(id); });
  addEventListener('pointerdown', (e) => { if (menu.style.display === 'block' && !menu.contains(e.target as Node)) menu.style.display = 'none'; }, true);

  /* ---------- convite de grupo recebido ---------- */
  const invBox = document.createElement('div'); invBox.id = 'pinvite'; document.body.appendChild(invBox);
  let invTimer = 0;
  function partyInvite(from: number, name: string, lvl: number) {
    if (noParty()) { net.answerParty(from, false, true); return; }
    clearTimeout(invTimer);
    invBox.innerHTML = `<div class="pi-t">⚑ Convite de grupo</div><p><b>${esc(name)}</b> (Nv ${lvl}) chama você para o grupo.</p><p class="cp-mut">No grupo, todos ganham bônus de XP e de achados, e as missões de um aparecem para os outros.</p><div class="pi-b"><button class="cp-btn gold" data-p="1">Aceitar</button><button class="cp-btn" data-p="0">Recusar</button></div><i class="pi-bar"></i>`;
    invBox.style.display = 'block'; invBox.dataset.from = String(from);
    invTimer = window.setTimeout(() => { if (invBox.style.display === 'block') { invBox.style.display = 'none'; net.answerParty(from, false); } }, 60000);
  }
  invBox.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('[data-p]') as HTMLElement | null; if (!b) return; clearTimeout(invTimer); invBox.style.display = 'none'; net.answerParty(+invBox.dataset.from!, b.dataset.p === '1'); });

  /* ---------- missão de um companheiro: aparece para o grupo ---------- */
  const qBox = document.createElement('div'); qBox.id = 'pquest'; document.body.appendChild(qBox); let qTimer = 0, qTake: (() => void) | null = null;
  function questShare(from: string, d: { name: string; text: string; lvl: number; giver: string }, stt: 'have' | 'done' | 'later' | 'ok', take: () => void) {
    clearTimeout(qTimer); qTake = stt === 'ok' ? take : null; qNo = null;
    const why = stt === 'have' ? 'Você já tem essa missão: os abates do grupo contam para os dois.' : stt === 'done' ? 'Você já fez essa missão.' : stt === 'later' ? 'Você ainda não chegou nessa parte da história.' : 'Pegue também e façam juntos: os abates do grupo contam para todos.';
    qBox.innerHTML = `<div class="pi-t">📜 Missão de ${esc(from)}</div><p><b>${esc(d.name)}</b> <span class="cp-mut">· Nv ${d.lvl} · ${esc(d.giver)}</span></p><p class="cp-mut">${esc(d.text)}</p><p>${why}</p><div class="pi-b">${stt === 'ok' ? '<button class="cp-btn gold" data-q="1">Pegar também</button><button class="cp-btn" data-q="0">Agora não</button>' : '<button class="cp-btn" data-q="0">Certo</button>'}</div><i class="pi-bar q"></i>`;
    qBox.style.display = 'block'; qTimer = window.setTimeout(() => { qBox.style.display = 'none'; }, 30000);
  }
  /** pergunta curta no mesmo quadro (duelo...) */
  function ask(title: string, text: string, yes: string, cb: (ok: boolean) => void, secs = 20) {
    clearTimeout(qTimer); qTake = () => cb(true);
    qBox.innerHTML = `<div class="pi-t">${esc(title)}</div><p>${esc(text)}</p><div class="pi-b"><button class="cp-btn gold" data-q="1">${esc(yes)}</button><button class="cp-btn" data-q="0">Recusar</button></div><i class="pi-bar q" style="animation-duration:${secs}s"></i>`;
    qBox.style.display = 'block'; qNo = () => cb(false); qTimer = window.setTimeout(() => { qBox.style.display = 'none'; qNo?.(); qNo = null; }, secs * 1000);
  }
  let qNo: (() => void) | null = null;
  qBox.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('[data-q]') as HTMLElement | null; if (!b) return; clearTimeout(qTimer); qBox.style.display = 'none'; if (b.dataset.q === '1') qTake?.(); else qNo?.(); qTake = null; qNo = null; });

  /* ---------- quadro do grupo (canto esquerdo) ---------- */
  const pf = document.createElement('div'); pf.id = 'partyf'; document.body.appendChild(pf);
  function drawParty() {
    const P = net.state === 'on' ? net.party : null; if (!P) { pf.style.display = 'none'; return; }
    pf.style.display = 'block';
    pf.innerHTML = `<div class="pf-h">Grupo · ${P.members.length}/6</div>` + P.members.map((id) => { const me = id === net.myId, inf = me ? null : net.infoOf(id); const hp = me ? hooks.myHp() : inf?.hp ?? 100;
      return `<div class="pf-m ${me ? 'me' : ''}" data-pid="${id}"><b>${P.leader === id ? '👑 ' : ''}${esc(net.nameOf(id))}</b><small>${me ? 'você' : `Nv ${inf?.lvl ?? '?'}`}</small><i><u style="width:${Math.max(0, Math.min(100, hp))}%"></u></i></div>`; }).join('') + `<button class="pf-x" data-a="pleave">Sair do grupo</button>`;
  }
  pf.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-a="pleave"]')) { net.leaveParty(); return; } const m = t.closest('[data-pid]') as HTMLElement | null; if (m && +m.dataset.pid! !== net.myId) { const r = m.getBoundingClientRect(); playerMenu(+m.dataset.pid!, r.right, r.top); } });
  setInterval(() => { if (net.party) drawParty(); }, 1000);

  /* ---------- perfil de outro jogador ---------- */
  const pw = document.createElement('div'); pw.id = 'profw'; pw.className = 'modalw'; document.body.appendChild(pw);
  let profFor = 0;
  function showProfile(id: number, p: NetProfile | null) {
    if (p && id !== profFor) return; profFor = id; pw.style.display = 'flex';
    if (!p) { pw.innerHTML = `<div class="pn prof"><h2>Perfil <button data-x>✕</button></h2><p class="cp-mut">Pedindo o perfil de ${esc(net.nameOf(id))}…</p></div>`; return; }
    const SL: Record<string, string> = { weapon: 'Arma', shield: 'Escudo', helm: 'Elmo', armor: 'Armadura', cape: 'Capa', shoulders: 'Ombreiras', gloves: 'Luvas', boots: 'Botas', belt: 'Cinto', ring: 'Anel', ring2: 'Anel', amulet: 'Amuleto', legs: 'Calças' };
    const k = Math.max(-100, Math.min(100, p.karma));
    pw.innerHTML = `<div class="pn prof" style="width:640px"><h2>${esc(p.name)} <button data-x>✕</button></h2>
      <div class="pr-top"><div class="pr-pic">${p.portrait ? `<img src="${p.portrait}" alt="">` : '<span>sem retrato</span>'}</div>
        <div class="pr-info"><div class="pr-lv">Nível ${p.lvl} · ${esc(p.cls)}</div>${p.title ? `<div class="pr-ti">${esc(p.title)}</div>` : ''}
          <div class="pr-al"><small>Alinhamento</small><b>${esc(p.align)}</b><div class="pr-kb"><i style="left:${(k + 100) / 2}%"></i></div><span>Karma ${k > 0 ? '+' : ''}${k}</span></div>
          ${p.fac ? `<div class="pr-fac">Jurado: <b>${esc(p.fac)}</b></div>` : '<div class="pr-fac cp-mut">Ainda não jurou nenhum lado</div>'}
          <div class="pr-st"><span>⚔ ${p.kills} abates</span><span>📜 ${p.quests} missões</span><span>🏅 ${p.featCount}/${p.featTotal} inscrições</span></div></div></div>
      <h3>Equipamento</h3><div class="pr-gear">${p.gear.length ? p.gear.map((g) => `<div><i>${g.icon}</i><b style="color:${g.col}">${esc(g.name)}</b><small>${SL[g.slot] ?? g.slot} · ${esc(g.rarity)}</small></div>`).join('') : '<p class="cp-mut">Sem equipamento.</p>'}</div>
      ${p.lives?.length ? `<h3>Vidas passadas</h3><div class="pr-lives">${p.lives.map((l, i) => `<div><i>${i + 1}</i><b>${esc(l.name)}</b><small>${esc(l.race)} · ${esc(l.cls)} · nível ${l.lvl}</small></div>`).join('')}</div>` : ''}
      <h3>Grandes feitos</h3><div class="pr-feats">${p.feats.length ? p.feats.map((f) => `<div><i>${f.icon}</i><b>${esc(f.name)}</b><small>${esc(f.desc)}</small></div>`).join('') : '<p class="cp-mut">Nenhuma inscrição ainda.</p>'}</div></div>`;
  }
  pw.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-x]') || t === pw) pw.style.display = 'none'; });

  return { toggle, playerMenu, partyInvite, questShare, ask, showProfile, get isOpen() { return open; } };
}
