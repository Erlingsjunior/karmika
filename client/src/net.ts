/* Jogar junto (etapa 1): conexão com a sala, envio do que o herói faz e os outros Caminhantes no mundo.
   Cada máquina gera o mesmo mundo e guarda o próprio save; pela rede só passa o essencial:
   posição, direção, velocidade, zona (rua ou dentro de qual casa), roupa/arma, golpes e chat. */
import * as THREE from 'three';
import { createCharacter, type CharOpts, type Hero3D, type Kind, type Action } from './characters';
import { attachSkin, type SkinDef } from './skin3d';
import { fine } from './dual3d';

export const NET_PROTO = 1;
export const NET_PORT = 7777;

type GearArg = Parameters<Hero3D['setGear']>[0];
export interface NetLook { kind: Kind; opts: CharOpts; gear: GearArg | null; skin: SkinDef | null; name: string; lvl: number; cls: string; karma: number; fac?: string | null; /** caminho (classe) e inclinação da alma: o Instinto dos outros lê isto (24/10) */ path?: string | null; lean?: 'luz' | 'sombra' | null }
export interface NetSt { x: number; y: number; z: number; f: number; m: number; zn: string; cb?: 1; gd?: 1; rd?: 1; kn?: 1; hp?: number; ag?: 1 }
export interface NetParty { id: number; leader: number; members: number[] }
/** perfil público: o que outro jogador vê ao abrir o seu perfil */
export interface NetProfile { name: string; lvl: number; cls: string; title: string; karma: number; align: string; fac: string | null; portrait: string | null; gear: { slot: string; name: string; rarity: string; icon: string; col: string }[]; feats: { name: string; desc: string; icon: string }[]; featCount: number; featTotal: number; kills: number; quests: number; lives?: { name: string; race: string; cls: string; lvl: number }[] }
interface Snap { at: number; s: NetSt }
interface Remote {
  id: number; name: string; host: boolean; look: NetLook | null; hero: Hero3D | null; skinTick: (() => void) | null; skinTok: number;
  snaps: Snap[]; el: HTMLDivElement; bubbleT: number; lookKey: string; zn: string;
}
export interface NetPeer { id: number; name: string; host: boolean; lvl: number; cls: string; me?: boolean; zn: string; ping?: number }

export interface NetCtx {
  scene: THREE.Scene; camera: THREE.Camera; canvas: HTMLCanvasElement;
  look(): NetLook;
  st(): NetSt;
  chat(name: string, text: string, whisper?: boolean): void;
  sys(text: string, color?: string): void;
  /** alguém entrou no mundo (aviso, som, notificação do sistema) */
  joined?(name: string): void;
  /** monta o meu perfil quando alguém pede para ver */
  profile(): NetProfile;
  /** alguém me chamou para o grupo: a interface pergunta (ou recusa sozinha se estiver bloqueado) */
  partyInvite(from: number, name: string, lvl: number): void;
  showProfile(id: number, p: NetProfile): void;
  /** carta de outro jogador chegou pela sala */
  mail?(letter: unknown): void;
  /** quadro de pedidos da sala mudou */
  posts?(list: NetPost[]): void;
  /** entrei (ou voltei) na sala */
  connected?(): void;
}
/** pedido no quadro da sala: quem pediu, o quê, quanto paga */
export interface NetPost { id: number; by: string; item: string; name: string; icon: string; n: number; gold: number; note: string; t: number }

/** "karmika://203.0.113.5:7777/AB12CD", "203.0.113.5:7777 AB12CD", "100.80.1.2 AB12CD" … */
export function parseInvite(s: string): { host: string; port: number; code: string } | null {
  const t = s.trim().replace(/^karmika:\/\//i, '').replace(/^wss?:\/\//i, '');
  const m = t.match(/^\[?([a-z0-9.\-:]+?)\]?(?::(\d{2,5}))?\s*[/\s#]\s*([A-Za-z0-9]{6})\s*$/i);
  if (!m) return null;
  return { host: m[1], port: Number(m[2]) || NET_PORT, code: m[3].toUpperCase() };
}
export const inviteOf = (host: string, port: number, code: string) => `karmika://${host}:${port}/${code}`;
/** senhas das salas ficam guardadas nesta máquina, por convite */
export const passFor = (inv: string): string => { try { return (JSON.parse(localStorage.getItem('karmika.coop.pass') || '{}') as Record<string, string>)[inv.trim()] || ''; } catch { return ''; } };
export const savePass = (inv: string, pass: string) => { try { const m = JSON.parse(localStorage.getItem('karmika.coop.pass') || '{}') as Record<string, string>; if (pass) m[inv.trim()] = pass; else delete m[inv.trim()]; localStorage.setItem('karmika.coop.pass', JSON.stringify(m)); } catch { /* */ } };
/** confere se dá para entrar (convite e senha) sem entrar de fato */
export function probeRoom(inv: string, pass = ''): Promise<{ ok: boolean; why?: string; pass?: boolean }> {
  const p = parseInvite(inv); if (!p) return Promise.resolve({ ok: false, why: 'Convite inválido.' });
  return new Promise((res) => { let done = false; const fin = (v: { ok: boolean; why?: string; pass?: boolean }) => { if (done) return; done = true; try { ws.close(); } catch { /* */ } res(v); };
    const ws = new WebSocket(`ws://${p.host}:${p.port}`);
    ws.onopen = () => ws.send(JSON.stringify({ t: 'hello', proto: NET_PROTO, code: p.code, pass, probe: true, name: '?' }));
    ws.onmessage = (e) => { try { const m = JSON.parse(String(e.data)); if (m.t === 'ok') fin({ ok: true, pass: m.pass }); else if (m.t === 'deny') fin({ ok: false, why: m.why, pass: !!m.pass }); else if (m.t === 'welcome') fin({ ok: true }); } catch { /* */ } };
    ws.onerror = () => fin({ ok: false, why: 'Não deu para alcançar esse servidor. Ele está ligado? O convite está certo?' });
    ws.onclose = () => fin({ ok: false, why: 'O servidor fechou a conexão.' });
    setTimeout(() => fin({ ok: false, why: 'O servidor não respondeu.' }), 7000); });
}

const lerpAng = (a: number, b: number, k: number) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; };

export function createNet(ctx: NetCtx) {
  let ws: WebSocket | null = null;
  let myId = 0, amHost = false, code = '', addr = '', pass = '', state: 'off' | 'connecting' | 'on' = 'off', ping = 0;
  let wantClose = false, retries = 0, party: NetParty | null = null, posts: NetPost[] = [];
  const partyOf = new Map<number, number>();
  const remotes = new Map<number, Remote>();
  let sendT = 0, keepT = 0, lookT = 0, pingT = 0, lastSt = '', lastLook = '';
  const listeners = new Set<() => void>();
  const changed = () => { for (const f of listeners) f(); };
  const xh = new Map<string, (from: number, m: Record<string, unknown>) => void>(); // eventos da etapa 2 (monstros, ...): o servidor só repassa
  const send = (m: object) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); };

  function buildHero(r: Remote) {
    if (r.hero) { ctx.scene.remove(r.hero.root); r.hero = null; r.skinTick = null; }
    if (!r.look) return;
    const L = r.look; let h: Hero3D;
    try { h = createCharacter(L.kind, { ...L.opts, static: false }); } catch { return; }
    r.hero = h; ctx.scene.add(fine(h.root)); h.root.userData.netId = r.id;
    try { if (L.gear) h.setGear(L.gear); } catch { /* */ }
    const last = r.snaps[r.snaps.length - 1]; if (last) { h.root.position.set(last.s.x, last.s.y, last.s.z); h.root.rotation.y = last.s.f; }
    if (L.skin) { const tok = ++r.skinTok; attachSkin(h, L.skin).then((res) => { if (!res) return; if (tok !== r.skinTok || r.hero !== h) { h.root.remove(res.model); return; } r.skinTick = res.tick; }).catch(() => { /* fica com o modelo procedural */ }); }
  }
  function setLook(r: Remote, look: NetLook | null) {
    r.look = look; if (!look) return;
    const key = JSON.stringify([look.kind, look.opts, look.skin]);
    if (key !== r.lookKey || !r.hero) { r.lookKey = key; buildHero(r); }
    else if (r.hero && look.gear) { try { r.hero.setGear(look.gear); } catch { /* */ } }
    // a plaquinha com o nome mostra nível e caminho (como os NPCs, em HTML: nítida em qualquer resolução)
    r.name = look.name || r.name; labelOf(r);
    r.name = look.name || r.name;
  }
  function addRemote(p: { id: number; name: string; host: boolean; look: NetLook | null; st: NetSt | null }) {
    const el = document.createElement('div'); el.className = 'npc pl'; el.innerHTML = '<b></b><small></small><p></p>'; document.body.appendChild(el);
    const r: Remote = { id: p.id, name: p.name, host: p.host, look: null, hero: null, skinTick: null, skinTok: 0, snaps: [], el, bubbleT: 0, lookKey: '', zn: p.st?.zn ?? '' };
    labelOf(r);
    remotes.set(p.id, r);
    if (p.st) r.snaps.push({ at: performance.now(), s: p.st });
    setLook(r, p.look);
    return r;
  }
  function labelOf(r: Remote) { (r.el.querySelector('b') as HTMLElement).textContent = (r.host ? '👑 ' : '') + r.name; (r.el.querySelector('small') as HTMLElement).textContent = r.look ? `Nv ${r.look.lvl} · ${r.look.cls}` : ''; r.el.classList.toggle('host', r.host); }
  function dropRemote(id: number) { const r = remotes.get(id); if (!r) return; if (r.hero) ctx.scene.remove(r.hero.root); r.el.remove(); remotes.delete(id); }
  function clearAll() { for (const id of [...remotes.keys()]) dropRemote(id); }

  function onMsg(m: { t: string; [k: string]: unknown }) {
    switch (m.t) {
      case 'welcome': {
        myId = m.id as number; amHost = !!m.host; state = 'on'; retries = 0; clearAll(); party = null; partyOf.clear();
        for (const p of m.players as Parameters<typeof addRemote>[0][]) addRemote(p);
        ctx.sys(amHost ? `✧ Sala aberta. Você é o anfitrião — convite: ${code}` : `✧ Você entrou na sala (${(m.players as unknown[]).length + 1} Caminhantes).`, '#ffd88a');
        lastLook = ''; lastSt = ''; changed(); ctx.connected?.(); break;
      }
      case 'deny': ctx.sys(`✖ ${m.why}`, '#ff8a7a'); wantClose = true; break;
      case 'closed': ctx.sys(`✖ ${m.why}`, '#ff8a7a'); wantClose = true; break;
      case 'join': { const r = addRemote(m as never); ctx.sys(`➜ ${r.name} chegou ao mundo.`, '#9ad0ff'); ctx.joined?.(r.name); changed(); break; }
      case 'leave': { const r = remotes.get(m.id as number); if (r) ctx.sys(`← ${r.name} deixou o mundo.`, '#b9a890'); dropRemote(m.id as number); changed(); break; }
      case 'host': { const id = m.id as number; amHost = id === myId; for (const r of remotes.values()) { r.host = r.id === id; labelOf(r); } if (amHost) ctx.sys('✧ O anfitrião saiu: agora a sala segue com você.', '#ffd88a'); changed(); break; }
      case 'st': { const r = remotes.get(m.id as number); if (!r) break; const s = m.s as NetSt; r.snaps.push({ at: performance.now(), s }); if (r.snaps.length > 12) r.snaps.shift(); if (s.zn !== r.zn) { r.zn = s.zn; changed(); } break; }
      case 'act': { const r = remotes.get(m.id as number); if (r?.hero) { try { r.hero.act(m.a as Action, true); } catch { /* ação desconhecida nesta versão */ } } break; }
      case 'look': { const r = remotes.get(m.id as number); if (r) { setLook(r, m.look as NetLook); changed(); } break; }
      case 'sys': ctx.sys(m.text as string, '#c8d8f0'); break;
      case 'party': { party = (m.party as NetParty | null) ?? null; for (const r of remotes.values()) r.el.classList.toggle('party', !!party && party.members.includes(r.id)); changed(); break; }
      case 'partyOf': for (const id of m.ids as number[]) { if (m.party) partyOf.set(id, m.party as number); else partyOf.delete(id); } changed(); break;
      case 'party:invite': ctx.partyInvite(m.from as number, m.name as string, m.lvl as number); break;
      case 'prof:req': { let data: NetProfile | null = null; try { data = ctx.profile(); } catch (err) { console.warn('[net] perfil', err); } if (data) send({ t: 'prof:res', to: m.from, data }); break; }
      case 'prof:res': ctx.showProfile(m.id as number, m.data as NetProfile); break;
      case 'chat': {
        const r = remotes.get(m.id as number); const name = (m.name as string) || r?.name || '?'; ctx.chat(name, m.text as string, !!m.w); if (m.w) break;
        if (r) { const p = r.el.querySelector('p') as HTMLElement; p.textContent = m.text as string; p.style.display = 'block'; r.bubbleT = 5; }
        break;
      }
      default: if (typeof m.t === 'string' && m.t.startsWith('x:')) { try { xh.get(m.t)?.(m.id as number, m); } catch (err) { console.warn('[net]', m.t, err); } } break;
      case 'mail': ctx.mail?.(m.letter); break;
      case 'mail:ok': if (!m.online) ctx.sys(`📮 ${m.to} não está na sala: a carta fica guardada no servidor e chega quando entrar.`, '#c8d8f0'); break;
      case 'posts': posts = (m.list as NetPost[]) ?? []; ctx.posts?.(posts); break;
      case 'pong': ping = Math.round(performance.now() - (m.at as number)); changed(); break;
    }
  }

  function connect(inv: string) {
    const p = parseInvite(inv); if (!p) { ctx.sys('✖ Convite inválido. O formato é karmika://IP:7777/CÓDIGO', '#ff8a7a'); return false; }
    disconnect(true);
    code = p.code; addr = `${p.host}:${p.port}`; pass = passFor(inv); state = 'connecting'; wantClose = false; changed();
    open();
    return true;
  }
  function open() {
    const host = addr.includes(':') && addr.split(':').length > 2 ? `[${addr.slice(0, addr.lastIndexOf(':'))}]${addr.slice(addr.lastIndexOf(':'))}` : addr;
    let sock: WebSocket; try { sock = new WebSocket(`ws://${host}`); } catch { state = 'off'; ctx.sys('✖ Endereço inválido.', '#ff8a7a'); changed(); return; }
    ws = sock;
    const timer = setTimeout(() => { if (sock.readyState !== 1) { sock.close(); } }, 9000);
    sock.onopen = () => { clearTimeout(timer); const L = ctx.look(); lastLook = JSON.stringify(L); send({ t: 'hello', proto: NET_PROTO, code, pass, name: L.name, look: L }); };
    sock.onmessage = (e) => { try { onMsg(JSON.parse(String(e.data))); } catch (err) { console.warn('[net] mensagem não tratada', err); } };
    sock.onclose = () => {
      clearTimeout(timer); if (ws !== sock) return;
      const was = state; ws = null; clearAll();
      if (!wantClose && was === 'on' && retries < 5) { retries++; state = 'connecting'; ctx.sys(`… conexão caiu, tentando de novo (${retries}/5)`, '#ffd24a'); changed(); setTimeout(() => { if (!wantClose && state === 'connecting') open(); }, 1500 * retries); return; }
      if (!wantClose && was === 'connecting' && retries === 0) ctx.sys(`✖ Não deu para alcançar ${addr}. Confira o convite, se a sala está aberta e se o firewall do anfitrião liberou o Karmika.`, '#ff8a7a');
      state = 'off'; myId = 0; party = null; changed();
    };
  }
  function disconnect(silent = false) {
    wantClose = true; if (ws) { const w = ws; ws = null; try { w.close(); } catch { /* */ } }
    if (state !== 'off' && !silent) ctx.sys('Você saiu da sala.', '#b9a890');
    state = 'off'; myId = 0; party = null; clearAll(); changed();
  }

  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  function update(dt: number, t: number) {
    if (state === 'on') {
      sendT -= dt; lookT -= dt; pingT -= dt;
      keepT -= dt;
      if (sendT <= 0) { // 10 vezes por segundo, só quando algo mudou (e a cada 1 s para manter vivo)
        sendT = 0.1; const s = ctx.st(); const k = JSON.stringify([+s.x.toFixed(2), +s.y.toFixed(2), +s.z.toFixed(2), +s.f.toFixed(2), +s.m.toFixed(1), s.zn, s.cb, s.gd, s.rd, s.kn, s.ag, s.hp]);
        if (k !== lastSt || keepT <= 0) { lastSt = k; keepT = 1; send({ t: 'st', s }); } }
      if (lookT <= 0) { lookT = 1; const L = ctx.look(), k = JSON.stringify(L); if (k !== lastLook) { lastLook = k; send({ t: 'look', look: L }); } }
      if (pingT <= 0) { pingT = 3; send({ t: 'ping', at: performance.now() }); }
    }
    const myZone = ctx.st().zn, now = performance.now(), rt = now - 140; // desenha 140 ms no passado: dá tempo de ter dois pontos para interpolar
    for (const r of remotes.values()) {
      const h = r.hero; if (!h) { r.el.style.display = 'none'; continue; }
      const vis = r.zn === myZone && r.snaps.length > 0; h.root.visible = vis; if (!vis) { r.el.style.display = 'none'; continue; }
      let a = r.snaps[0], b = r.snaps[r.snaps.length - 1];
      for (let i = 0; i < r.snaps.length - 1; i++) if (r.snaps[i].at <= rt && r.snaps[i + 1].at >= rt) { a = r.snaps[i]; b = r.snaps[i + 1]; break; }
      const k = b.at > a.at ? THREE.MathUtils.clamp((rt - a.at) / (b.at - a.at), 0, 1) : 1;
      tmpA.set(THREE.MathUtils.lerp(a.s.x, b.s.x, k), THREE.MathUtils.lerp(a.s.y, b.s.y, k), THREE.MathUtils.lerp(a.s.z, b.s.z, k));
      if (h.root.position.distanceTo(tmpA) > 12) h.root.position.copy(tmpA); else h.root.position.lerp(tmpA, Math.min(1, dt * 18));
      const f = lerpAng(a.s.f, b.s.f, k), s = k > 0.5 ? b.s : a.s;
      h.combat = !!s.cb; h.guard = !!s.gd; h.riding = !!s.rd; h.kneel = !!s.kn; r.el.classList.toggle('ag', !!s.ag); // PvP da facção ligado: nome vermelho
      h.update(dt, t, s.m, f); h.root.rotation.y = lerpAng(h.root.rotation.y, f, Math.min(1, dt * 14));
      r.skinTick?.();
      { const hp = h.root.position; tmpB.set(hp.x, hp.y + 2.15, hp.z).project(ctx.camera); const on = tmpB.z < 1 && Math.abs(tmpB.x) < 1.1 && Math.abs(tmpB.y) < 1.1; r.el.style.display = on ? 'block' : 'none';
        if (on) { const rc = ctx.canvas.getBoundingClientRect(); r.el.style.left = rc.left + (tmpB.x * 0.5 + 0.5) * rc.width + 'px'; r.el.style.top = rc.top + (-tmpB.y * 0.5 + 0.5) * rc.height + 'px'; } }
      if (r.bubbleT > 0) { r.bubbleT -= dt; if (r.bubbleT <= 0) (r.el.querySelector('p') as HTMLElement).style.display = 'none'; }
    }
  }

  return {
    connect, disconnect, update,
    /** evento livre para todos da sala (o tipo começa com "x:") */
    sendMail(letter: object) { if (state !== 'on') return false; send({ t: 'mail', letter }); return true; },
    postAdd(p: { item: string; name: string; icon: string; n: number; gold: number; note: string }) { send({ t: 'post:add', post: p }); },
    postFill(id: number, att: object[]) { send({ t: 'post:fill', id, att }); },
    postCancel(id: number) { send({ t: 'post:cancel', id }); },
    get posts() { return state === 'on' ? posts : []; },
    x(t: string, data: object) { if (state === 'on') send({ ...data, t }); },
    onX(t: string, f: (from: number, m: Record<string, unknown>) => void) { xh.set(t, f); },
    /** golpe, magia, esquiva: os outros veem na hora */
    act(a: string) { if (state === 'on') send({ t: 'act', a }); },
    say(text: string) { if (state === 'on') send({ t: 'chat', text }); },
    whisper(to: string, text: string) { if (state !== 'on') { ctx.sys('Você não está em nenhuma sala.'); return; } const nrm = (x: string) => x.replace(/[\s_]+/g, '_').toLowerCase(); const r = [...remotes.values()].find((q) => nrm(q.name) === nrm(to)); send({ t: 'w', to: r ? r.id : to, text }); },
    inviteParty(id: number) { send({ t: 'party:invite', to: id }); },
    answerParty(from: number, ok: boolean, auto = false) { send({ t: 'party:answer', from, ok, auto }); },
    leaveParty() { send({ t: 'party:leave' }); },
    kick(id: number) { send({ t: 'party:kick', id }); },
    makeLeader(id: number) { send({ t: 'party:lead', id }); },
    askProfile(id: number) { send({ t: 'prof:req', to: id }); },
    get party() { return party; }, get myId() { return myId; },
    nameOf(id: number) { return id === myId ? ctx.look().name : remotes.get(id)?.name ?? '?'; },
    infoOf(id: number) { const r = remotes.get(id); if (!r) return null; return { id, name: r.name, lvl: r.look?.lvl ?? 1, cls: r.look?.cls ?? '', hp: r.snaps[r.snaps.length - 1]?.s.hp ?? 100, zn: r.zn, inParty: partyOf.get(id) ?? 0 }; },
    /** Ctrl + clique: qual jogador está sob o mouse (pela silhueta projetada na tela) */
    pickAt(cx: number, cy: number) {
      const rc = ctx.canvas.getBoundingClientRect(); let best = 0, bd = 1e9;
      for (const r of remotes.values()) { const h = r.hero; if (!h || !h.root.visible) continue; const p = h.root.position;
        for (const yy of [0.2, 0.9, 1.6]) { tmpB.set(p.x, p.y + yy, p.z).project(ctx.camera); const sx = rc.left + (tmpB.x * 0.5 + 0.5) * rc.width, sy = rc.top + (-tmpB.y * 0.5 + 0.5) * rc.height; const d = Math.hypot(sx - cx, sy - cy); if (d < bd) { bd = d; best = r.id; } } }
      tmpB.set(0, 0, 0); return bd < 46 ? best : 0;
    },
    /** força reenviar a roupa já (troca de equipamento) */
    lookNow() { lookT = 0; },
    get state() { return state; }, get isHost() { return amHost; }, get ping() { return ping; }, get address() { return addr; }, get code() { return code; },
    peers(): NetPeer[] { const me = ctx.look(); return [{ id: myId, name: me.name, host: amHost, lvl: me.lvl, cls: me.cls, me: true, zn: ctx.st().zn, ping }, ...[...remotes.values()].map((r) => ({ id: r.id, name: r.name, host: r.host, lvl: r.look?.lvl ?? 1, cls: r.look?.cls ?? '', zn: r.zn }))]; },
    /** jogadores remotos (para mapa, xray e, na etapa 2, monstros e grupo) */
    remotes(): { id: number; name: string; pos: THREE.Vector3; root: THREE.Object3D; zn: string; fac: string | null; pvp: boolean; path: string | null; lean: 'luz' | 'sombra' | null; lvl: number }[] { return [...remotes.values()].filter((r) => r.hero).map((r) => ({ id: r.id, name: r.name, pos: r.hero!.root.position, root: r.hero!.root, zn: r.zn, fac: r.look?.fac ?? null, pvp: !!r.snaps[r.snaps.length - 1]?.s.ag, path: r.look?.path ?? null, lean: r.look?.lean ?? null, lvl: r.look?.lvl ?? 1 })); },
    /** o Instinto pinta o nome de quem é inimigo natural (e o tecnocrata lê a assinatura de todos) */ nameTint(id: number, color: string | null, extra?: string) { const r = remotes.get(id); if (!r) return; const b = r.el.querySelector('b') as HTMLElement | null; if (b) b.style.color = color ?? ''; const sm = r.el.querySelector('small') as HTMLElement | null; if (sm) sm.dataset.extra = extra ?? ''; if (sm && r.look) sm.textContent = `Nv ${r.look.lvl} · ${r.look.cls}${extra ? ' · ' + extra : ''}`; },
    onChange(f: () => void) { listeners.add(f); return () => listeners.delete(f); },
  };
}
export type Net = ReturnType<typeof createNet>;
