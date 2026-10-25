/* Servidor de Karmika para jogar junto (3 a 6 pessoas).
   Não guarda o mundo: cada jogador gera o mesmo mundo na própria máquina e traz o próprio save.
   O servidor só confere o convite e repassa o que cada um faz (posição, roupa, golpes, chat) para os outros.
   O primeiro a entrar é o anfitrião: é ele quem vai comandar os monstros na etapa 2.
   Roda dentro do app (botão "Abrir servidor") ou sozinho:  node desktop/src/server.cjs 7777 */
'use strict';
const { WebSocketServer } = require('ws');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const dgram = require('node:dgram');
const DISCOVERY_PORT = 7778; // salas se anunciam na rede local: o jogo lista sem ninguém digitar endereço

/* ---- o servidor também entrega o jogo: quem entra com uma versão velha baixa só o que mudou ---- */
function walk(dir, base = dir, out = []) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const f = path.join(dir, e.name); if (e.isDirectory()) walk(f, base, out); else out.push(path.relative(base, f).split(path.sep).join('/')); } return out; }
/** lista de arquivos do jogo com o "carimbo" (hash) de cada um; a versão é o carimbo do conjunto */
function gameManifest(dir) {
  if (!dir || !fs.existsSync(path.join(dir, 'index.html'))) return null;
  let built = 0; try { built = JSON.parse(fs.readFileSync(path.join(dir, 'karmika-manifest.json'), 'utf8')).built || 0; } catch { /* sem carimbo de compilação */ }
  const files = {};
  for (const rel of walk(dir)) { if (rel === 'karmika-manifest.json') continue; const buf = fs.readFileSync(path.join(dir, rel)); files[rel] = { size: buf.length, hash: crypto.createHash('sha1').update(buf).digest('hex') }; }
  const version = crypto.createHash('sha1').update(Object.keys(files).sort().map((k) => k + ':' + files[k].hash).join('|')).digest('hex').slice(0, 16);
  return { version, built: built || Date.now(), files };
}
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.fbx': 'application/octet-stream', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };

const PROTO = 1;
const MAX = 12;       // gente na sala
const PARTY_MAX = 6; // gente num grupo
const PARTY_GAP = 10; // diferença máxima de nível dentro do grupo (ninguém puxa ninguém)
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem O/0 e I/1 para não confundir ao ditar

function makeCode() { let s = ''; for (let i = 0; i < 6; i++) s += ABC[Math.floor(Math.random() * ABC.length)]; return s; }

/** abre a sala; devolve { port, code, stop(), players() } */
function startServer(opts = {}) {
  const port = opts.port || 7777;
  const code = (opts.code || makeCode()).toUpperCase();
  const log = opts.log || ((...a) => console.log('[karmika]', ...a));
  return new Promise((resolve, reject) => {
    const gameDir = opts.gameDir ? path.resolve(opts.gameDir) : null;
    const manifest = gameManifest(gameDir);
    if (manifest) log(`entregando o jogo da pasta ${gameDir} · versão ${manifest.version} (${Object.keys(manifest.files).length} arquivos)`);
    const web = http.createServer((req, res) => {
      const u = new URL(req.url || '/', 'http://x');
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (u.pathname === '/karmika/manifest.json') { if (!manifest) { res.writeHead(404); res.end('sem jogo'); return; } res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(manifest)); return; }
      if (u.pathname.startsWith('/karmika/files/') && manifest) {
        const rel = decodeURIComponent(u.pathname.slice('/karmika/files/'.length));
        if (!manifest.files[rel]) { res.writeHead(404); res.end(); return; } // só entrega o que está na lista (nada de ../)
        res.writeHead(200, { 'Content-Type': MIME[path.extname(rel).toLowerCase()] || 'application/octet-stream', 'Content-Length': manifest.files[rel].size });
        fs.createReadStream(path.join(gameDir, rel)).pipe(res); return;
      }
      if (u.pathname === '/karmika/info') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(infoNow())); return; } // o jogo no navegador confere salas neste PC
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Karmika: servidor ligado.');
    });
    const wss = new WebSocketServer({ server: web, maxPayload: 512 * 1024 });
    /** @type {Map<number, {ws: any, id: number, name: string, look: any, st: any, host: boolean}>} */
    const players = new Map();
    let nid = 1;
    /* ---- o que a sala guarda entre sessões: cartas para quem está fora e o quadro de pedidos ---- */
    const dataFile = opts.dataFile || null;
    let store = { mail: {}, posts: [], pid: 1 };
    try { if (dataFile && fs.existsSync(dataFile)) store = { ...store, ...JSON.parse(fs.readFileSync(dataFile, 'utf8')) }; } catch (e) { log('não deu para ler os dados da sala:', e.message); }
    let saveT = null; const saveStore = () => { if (!dataFile || saveT) return; saveT = setTimeout(() => { saveT = null; try { fs.writeFileSync(dataFile, JSON.stringify(store)); } catch (e) { log('não deu para salvar os dados da sala:', e.message); } }, 400); };
    const lc = (n) => String(n || '').trim().toLowerCase();
    const byName = (n) => [...players.values()].find((p) => lc(p.name) === lc(n));
    /** carta para alguém: entrega na hora se estiver na sala; senão guarda até a pessoa entrar */
    function post(letter) { const to = byName(letter.to); if (to) { send(to.ws, { t: 'mail', letter }); return true; } (store.mail[lc(letter.to)] ||= []).push(letter); if (store.mail[lc(letter.to)].length > 200) store.mail[lc(letter.to)].shift(); saveStore(); return false; }
    const sysLetter = (to, subj, text, att) => ({ id: 's' + Date.now() + Math.random().toString(36).slice(2, 6), from: 'Correio de Karmika', to, subj, text, att: att || [], cod: 0, t: Date.now() });
    const postsMsg = () => ({ t: 'posts', list: store.posts });
    const roomName = String(opts.name || '').slice(0, 32);
    function infoNow() { const host = [...players.values()].find((p) => p.host); return { karmika: 1, proto: PROTO, port, code, name: roomName || (host ? `Sala de ${host.name}` : 'Sala Karmika'), players: players.size, max: MAX, pass: !!opts.password }; }
    /* anúncio na rede local a cada 2 s (UDP broadcast) */
    let udp = null; try { udp = dgram.createSocket({ type: 'udp4', reuseAddr: true }); udp.on('error', () => { try { udp.close(); } catch { /* */ } udp = null; }); udp.bind(() => { try { udp.setBroadcast(true); } catch { /* */ } }); } catch { udp = null; }
    const announce = setInterval(() => { if (!udp) return; const b = Buffer.from(JSON.stringify(infoNow())); try { udp.send(b, DISCOVERY_PORT, '255.255.255.255'); udp.send(b, DISCOVERY_PORT, '127.0.0.1'); } catch { /* sem rede */ } }, 2000);
    const send = (ws, m) => { if (ws.readyState === 1) ws.send(JSON.stringify(m)); };
    const others = (id, m) => { const s = JSON.stringify(m); for (const p of players.values()) if (p.id !== id && p.ws.readyState === 1) p.ws.send(s); };
    const info = (p) => ({ id: p.id, name: p.name, look: p.look, st: p.st, host: p.host, party: p.party ? p.party.id : 0 });
    /* ---- grupos: até 6, diferença de nível de no máximo 10, um líder ---- */
    let pid = 1; const invites = new Map(); // `${de}>${para}` → hora do convite
    const lvlOf = (p) => Number(p.look && p.look.lvl) || 1;
    function partyMsg(party) { return { t: 'party', party: party ? { id: party.id, leader: party.leader, members: [...party.members] } : null }; }
    function sendParty(party) { const m = partyMsg(party); for (const id of party.members) { const p = players.get(id); if (p) send(p.ws, m); } const all = { t: 'partyOf', ids: [...party.members], party: party.members.size ? party.id : 0 }; for (const p of players.values()) send(p.ws, all); }
    function leaveParty(p, why) {
      const party = p.party; if (!party) return; party.members.delete(p.id); p.party = null; send(p.ws, partyMsg(null));
      for (const p2 of players.values()) send(p2.ws, { t: 'partyOf', ids: [p.id], party: 0 });
      if (party.members.size <= 1) { for (const id of party.members) { const q = players.get(id); if (q) { q.party = null; send(q.ws, partyMsg(null)); send(q.ws, { t: 'sys', text: 'O grupo se desfez.' }); for (const p2 of players.values()) send(p2.ws, { t: 'partyOf', ids: [id], party: 0 }); } } return; }
      if (party.leader === p.id) party.leader = party.members.values().next().value;
      sendParty(party); for (const id of party.members) { const q = players.get(id); if (q) send(q.ws, { t: 'sys', text: `${p.name} ${why || 'saiu do grupo'}.` }); }
    }

    web.on('error', (e) => reject(e));
    web.listen(port, '0.0.0.0', () => { log(`sala aberta na porta ${port} · convite ${code}`); resolve({ port, code, stop, players: () => [...players.values()].map(info), version: manifest ? manifest.version : null }); });
    wss.on('connection', (ws, req) => {
      let me = null;
      const ip = req.socket.remoteAddress;
      const bye = setTimeout(() => { if (!me) ws.close(4001, 'sem apresentação'); }, 8000);
      ws.on('message', (raw) => {
        let m; try { m = JSON.parse(String(raw)); } catch { return; }
        if (!me) {
          if (m.t !== 'hello') return;
          if (m.proto !== PROTO) { send(ws, { t: 'deny', why: 'Versões diferentes do jogo. Atualize o Karmika.' }); ws.close(); return; }
          if (String(m.code || '').toUpperCase() !== code) { send(ws, { t: 'deny', why: 'Convite errado.' }); ws.close(); return; }
          if (opts.password && String(m.pass || '') !== String(opts.password)) { send(ws, { t: 'deny', why: m.pass ? 'Senha errada.' : 'Esta sala tem senha.', pass: true }); ws.close(); return; }
          if (m.probe) { send(ws, { t: 'ok', players: players.size, pass: !!opts.password }); ws.close(); return; } // só conferindo se dá para entrar
          if (players.size >= MAX) { send(ws, { t: 'deny', why: `A sala está cheia (${MAX}).` }); ws.close(); return; }
          if (m.world && opts.world && m.world !== opts.world) { send(ws, { t: 'deny', why: 'Mundo diferente do anfitrião. Atualize o Karmika.' }); ws.close(); return; }
          clearTimeout(bye);
          me = { ws, id: nid++, name: String(m.name || 'Caminhante').slice(0, 24), look: m.look || null, st: null, host: players.size === 0 };
          players.set(me.id, me);
          send(ws, { t: 'welcome', id: me.id, host: me.host, code, players: [...players.values()].filter((p) => p !== me).map(info) });
          others(me.id, { t: 'join', ...info(me) });
          { const q = store.mail[lc(me.name)]; if (q && q.length) { for (const letter of q) send(ws, { t: 'mail', letter }); delete store.mail[lc(me.name)]; saveStore(); } } // cartas que chegaram enquanto estava fora
          send(ws, postsMsg());
          log(`${me.name} entrou (${ip}) · ${players.size} na sala`);
          return;
        }
        switch (m.t) {
          case 'st': me.st = m.s; others(me.id, { t: 'st', id: me.id, s: m.s }); break; // posição, direção, velocidade, zona
          case 'act': others(me.id, { t: 'act', id: me.id, a: String(m.a).slice(0, 24) }); break; // golpe/magia/esquiva
          case 'look': me.look = m.look; others(me.id, { t: 'look', id: me.id, look: m.look }); break; // roupa/arma mudou
          case 'chat': { const text = String(m.text || '').slice(0, 240).trim(); if (text) { const msg = { t: 'chat', id: me.id, name: me.name, text }; others(me.id, msg); } break; }
          case 'ping': send(ws, { t: 'pong', at: m.at }); break;
          case 'w': { const to = [...players.values()].find((p) => p.id === m.to || p.name.toLowerCase() === String(m.to || '').toLowerCase()); const text = String(m.text || '').slice(0, 240).trim();
            if (!to) { send(ws, { t: 'sys', text: `Ninguém chamado ${m.to} está na sala.` }); break; } if (text) send(to.ws, { t: 'chat', w: 1, id: me.id, name: me.name, text }); break; }
          case 'party:invite': {
            const to = players.get(m.to); if (!to || to === me) break;
            if (me.party && me.party.leader !== me.id) { send(ws, { t: 'sys', text: 'Só o líder do grupo pode convidar.' }); break; }
            if (to.party) { send(ws, { t: 'sys', text: `${to.name} já está em um grupo.` }); break; }
            if (me.party && me.party.members.size >= PARTY_MAX) { send(ws, { t: 'sys', text: `O grupo já tem ${PARTY_MAX} Caminhantes.` }); break; }
            const lv = [...(me.party ? [...me.party.members].map((id) => players.get(id)).filter(Boolean) : [me])].map(lvlOf); const tl = lvlOf(to);
            if (Math.max(...lv, tl) - Math.min(...lv, tl) > PARTY_GAP) { send(ws, { t: 'sys', text: `Diferença de nível grande demais (máximo ${PARTY_GAP}). Em Karmika ninguém é puxado: cada um sobe com as próprias mãos.` }); break; }
            invites.set(`${me.id}>${to.id}`, Date.now()); send(to.ws, { t: 'party:invite', from: me.id, name: me.name, lvl: lvlOf(me) }); send(ws, { t: 'sys', text: `Convite de grupo enviado para ${to.name}.` }); break;
          }
          case 'party:answer': {
            const from = players.get(m.from); const k = `${m.from}>${me.id}`; const at = invites.get(k); invites.delete(k);
            if (!from || !at || Date.now() - at > 120000) { send(ws, { t: 'sys', text: 'Esse convite expirou.' }); break; }
            if (!m.ok) { send(from.ws, { t: 'sys', text: m.auto ? `${me.name} não está aceitando convites de grupo.` : `${me.name} recusou o convite de grupo.` }); break; }
            if (me.party) break;
            let party = from.party; if (!party) { party = { id: pid++, leader: from.id, members: new Set([from.id]) }; from.party = party; }
            if (party.members.size >= PARTY_MAX) { send(ws, { t: 'sys', text: 'O grupo encheu antes de você entrar.' }); break; }
            party.members.add(me.id); me.party = party; sendParty(party);
            for (const id of party.members) { const q = players.get(id); if (q) send(q.ws, { t: 'sys', text: id === me.id ? `Você entrou no grupo de ${players.get(party.leader)?.name}.` : `${me.name} entrou no grupo.` }); }
            break;
          }
          case 'party:leave': leaveParty(me); break;
          case 'party:kick': { if (!me.party || me.party.leader !== me.id) break; const q = players.get(m.id); if (q && q.party === me.party) { leaveParty(q, 'foi removido do grupo'); send(q.ws, { t: 'sys', text: 'O líder removeu você do grupo.' }); } break; }
          case 'party:lead': { if (!me.party || me.party.leader !== me.id || !me.party.members.has(m.id)) break; me.party.leader = m.id; sendParty(me.party); break; }
          case 'mail': { // carta de jogador para jogador (o remetente é sempre quem mandou)
            const L = m.letter || {}; const to = String(L.to || '').slice(0, 24).trim(); if (!to) break;
            const letter = { id: 'p' + Date.now() + Math.random().toString(36).slice(2, 6), from: me.name, to, subj: String(L.subj || '').slice(0, 80), text: String(L.text || '').slice(0, 2000), att: Array.isArray(L.att) ? L.att.slice(0, 7) : [], cod: Math.max(0, Number(L.cod) || 0), t: Date.now() };
            const online = post(letter); send(ws, { t: 'mail:ok', to, online }); break; }
          case 'post:add': { // pedido no quadro: o ouro da recompensa já vem separado (garantia)
            const P = m.post || {}; const n = Math.max(1, Math.min(999, Number(P.n) || 1)), gold = Math.max(1, Math.min(1e6, Number(P.gold) || 1));
            if (store.posts.filter((x) => lc(x.by) === lc(me.name)).length >= 5) { send(ws, { t: 'sys', text: 'No máximo 5 pedidos seus no quadro.' }); post(sysLetter(me.name, 'Pedido devolvido', 'O quadro só aceita 5 pedidos seus de cada vez. O ouro voltou.', [{ gold }])); break; }
            store.posts.push({ id: store.pid++, by: me.name, item: String(P.item || '').slice(0, 40), name: String(P.name || '').slice(0, 40), icon: String(P.icon || '').slice(0, 8), n, gold, note: String(P.note || '').slice(0, 140), t: Date.now() });
            saveStore(); for (const p of players.values()) send(p.ws, postsMsg()); break; }
          case 'post:fill': { // alguém entregou: os itens vão por carta para quem pediu, o ouro vai para quem entregou
            const i = store.posts.findIndex((x) => x.id === m.id); const att = Array.isArray(m.att) ? m.att.slice(0, 7) : [];
            if (i < 0) { post(sysLetter(me.name, 'Pedido já atendido', 'Alguém chegou antes. Seus itens voltaram.', att)); send(ws, { t: 'sys', text: 'Esse pedido já foi atendido: seus itens voltam pelo correio.' }); break; }
            const P = store.posts.splice(i, 1)[0]; saveStore();
            post({ ...sysLetter(P.by, `Pedido atendido: ${P.n}× ${P.name}`, `${me.name} atendeu o seu pedido no quadro.\n\n“${P.note || ''}”`, att), from: me.name });
            post(sysLetter(me.name, `Recompensa: ${P.n}× ${P.name}`, `${P.by} pagou pelo pedido que você atendeu.`, [{ gold: P.gold }]));
            for (const p of players.values()) send(p.ws, postsMsg()); break; }
          case 'post:cancel': { const i = store.posts.findIndex((x) => x.id === m.id && lc(x.by) === lc(me.name)); if (i < 0) break; const P = store.posts.splice(i, 1)[0]; saveStore();
            post(sysLetter(me.name, 'Pedido retirado do quadro', `Você retirou o pedido de ${P.n}× ${P.name}. O ouro da recompensa voltou.`, [{ gold: P.gold }])); for (const p of players.values()) send(p.ws, postsMsg()); break; }
          case 'prof:req': { const to = players.get(m.to); if (to) send(to.ws, { t: 'prof:req', from: me.id }); break; } // pede o perfil: quem responde é o próprio jogador
          case 'prof:res': { const to = players.get(m.to); if (to) send(to.ws, { t: 'prof:res', id: me.id, data: m.data }); break; }
          default: if (typeof m.t === 'string' && m.t.startsWith('x:')) others(me.id, { ...m, id: me.id }); // eventos novos (etapa 2) passam direto
        }
      });
      ws.on('close', () => {
        clearTimeout(bye);
        if (!me) return;
        leaveParty(me, 'deixou o mundo'); players.delete(me.id); others(me.id, { t: 'leave', id: me.id, name: me.name });
        if (me.host) { const next = players.values().next().value; if (next) { next.host = true; for (const p of players.values()) send(p.ws, { t: 'host', id: next.id }); } }
        log(`${me.name} saiu · ${players.size} na sala`);
      });
    });
    // mantém conexões vivas atrás de roteadores que derrubam silêncio
    const beat = setInterval(() => { for (const p of players.values()) if (p.ws.readyState === 1) p.ws.ping(); }, 20000);
    function stop() { clearInterval(beat); clearInterval(announce); try { udp?.close(); } catch { /* */ } for (const p of players.values()) { send(p.ws, { t: 'closed', why: 'O anfitrião fechou a sala.' }); p.ws.close(); } players.clear(); return new Promise((r) => wss.close(() => web.close(() => r()))); }
  });
}

module.exports = { startServer, PROTO, gameManifest, DISCOVERY_PORT };

if (require.main === module) {
  /* node server.cjs [porta] [codigo] [pasta-do-jogo]  ou com nomes:  --porta 7777 --codigo KARMA1 --senha segredo --jogo pasta */
  const args = process.argv.slice(2), flag = (n) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : undefined; }, pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
  const port = Number(flag('porta') || pos[0]) || 7777;
  // por padrão entrega o jogo compilado do projeto (client/dist)
  const gameDir = flag('jogo') || pos[2] || path.join(__dirname, '..', '..', 'client', 'dist');
  const password = flag('senha') || process.env.KARMIKA_SENHA || '';
  if (password) console.log('[karmika] sala com senha');
  const dataFile = flag('dados') || path.join(__dirname, '..', 'sala-dados.json'); // cartas guardadas e quadro de pedidos
  startServer({ port, code: flag('codigo') || pos[1], gameDir, password, dataFile, name: flag('nome') }).catch((e) => { console.error('Não deu para abrir a sala:', e.message); process.exit(1); });
}
