/* A CONTA E O HUB (26/10, Erling: "pedido de amizade vai para o jogador e não para o personagem"; "os contatos têm que estar fora
   da sala"). A conta é da máquina, não do personagem: um id e uma chave criados uma vez (localStorage global, fora dos espaços
   de personagem). O hub é uma conexão leve com o servidor, separada da sala: liga assim que o jogador escolhe um servidor e fica
   ligada no menu e no mundo. Por ela passam amigos, pedidos, conversas e a guilda. */
import { parseInvite, passFor } from './net';

export interface Acc { id: string; key: string; nick: string }
const KEY = 'karmika.player', LAST = 'karmika.coop.hub';
const rnd = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, '0')).join('');
export function account(nickHint?: string): Acc {
  let a: Acc | null = null; try { a = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { a = null; }
  if (!a?.id || !a.key) { a = { id: rnd(12), key: rnd(24), nick: (nickHint || 'Caminhante').slice(0, 20) }; try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* */ } }
  return a;
}
export function setNick(n: string) { const a = account(); a.nick = n; try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* */ } }

type H = (m: Record<string, unknown>) => void;
export function createHub(o: { char(): string; where(): 'mundo' | 'menu' }) {
  let ws: WebSocket | null = null, inv = '', state: 'off' | 'connecting' | 'on' = 'off', retry = 0, want = false, lastWhere = '';
  const hs = new Map<string, Set<H>>(), any = new Set<() => void>();
  const emit = (m: Record<string, unknown>) => { for (const f of hs.get(m.t as string) ?? []) { try { f(m); } catch (e) { console.warn('[hub]', m.t, e); } } for (const f of any) f(); };
  function connect(invite: string) {
    const p = parseInvite(invite); if (!p) return false; if (ws && inv === invite && state !== 'off') return true;
    close(); inv = invite; want = true; try { localStorage.setItem(LAST, invite); } catch { /* */ } open(); return true;
  }
  function open() {
    const p = parseInvite(inv); if (!p) return; state = 'connecting'; emit({ t: 'hub:state' });
    const host = p.host.includes(':') ? `[${p.host}]` : p.host; let s: WebSocket; try { s = new WebSocket(`ws://${host}:${p.port}`); } catch { state = 'off'; return; } ws = s;
    s.onopen = () => { const a = account(o.char() || undefined); lastWhere = o.where() + o.char(); s.send(JSON.stringify({ t: 'a:hello', code: p.code, pass: passFor(inv), acc: a, char: o.char(), where: o.where() })); };
    s.onmessage = (e) => { let m: Record<string, unknown>; try { m = JSON.parse(String(e.data)); } catch { return; } if (m.t === 'a:me') { state = 'on'; retry = 0; } if (m.t === 'a:deny') want = false; emit(m); };
    s.onclose = () => { if (ws !== s) return; ws = null; state = 'off'; emit({ t: 'hub:state' }); if (want && retry < 8) { retry++; setTimeout(() => { if (want && !ws) open(); }, Math.min(15000, 1500 * retry)); } };
  }
  function close() { want = false; if (ws) { const w = ws; ws = null; try { w.close(); } catch { /* */ } } state = 'off'; }
  const send = (m: Record<string, unknown>) => { if (ws && ws.readyState === 1) { ws.send(JSON.stringify(m)); return true; } return false; };
  /* conta onde está: no menu ou no mundo, e com qual personagem (os amigos veem; a guilda é do personagem) */
  setInterval(() => { if (state !== 'on') return; const w = o.where() + o.char(); if (w !== lastWhere) { lastWhere = w; send({ t: 'a:where', char: o.char(), where: o.where() }); } }, 1500);
  { const last = (() => { try { return localStorage.getItem(LAST) || ''; } catch { return ''; } })(); if (last) setTimeout(() => connect(last), 400); }
  return { connect, close, send, on(t: string, f: H) { if (!hs.has(t)) hs.set(t, new Set()); hs.get(t)!.add(f); }, onAny(f: () => void) { any.add(f); }, get state() { return state; }, get invite() { return inv; } };
}
export type Hub = ReturnType<typeof createHub>;
