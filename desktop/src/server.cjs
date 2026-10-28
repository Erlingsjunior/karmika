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
    /* 26/10 (Erling): a sala fica ligada o tempo todo; depois de um `pnpm build` ela percebe sozinha o jogo novo (olha o carimbo
       do dist a cada pedido, sem precisar reiniciar) */
    let manifest = gameManifest(gameDir), stampAt = 0;
    const stamp = () => { try { return fs.statSync(path.join(gameDir, 'karmika-manifest.json')).mtimeMs; } catch { return 0; } };
    if (manifest) { stampAt = stamp(); log(`entregando o jogo da pasta ${gameDir} · versão ${manifest.version} (${Object.keys(manifest.files).length} arquivos)`); }
    const freshen = () => { if (!gameDir) return; const st = stamp(); if (st && st !== stampAt) { stampAt = st; const m = gameManifest(gameDir); if (m && (!manifest || m.version !== manifest.version)) { manifest = m; log(`jogo atualizado no dist · versão ${m.version} (${Object.keys(m.files).length} arquivos) — avisando quem está dentro`); announceUpdate(m.version); } } };
    setInterval(freshen, 5000).unref();
    const web = http.createServer((req, res) => {
      const u = new URL(req.url || '/', 'http://x');
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (u.pathname === '/karmika/manifest.json') { freshen(); if (!manifest) { res.writeHead(404); res.end('sem jogo'); return; } res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(manifest)); return; }
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
    let store = { mail: {}, posts: [], pid: 1, accounts: {}, dmq: {}, guilds: {}, gseq: 1, amail: {}, amseq: 1 };
    try { if (dataFile && fs.existsSync(dataFile)) store = { ...store, ...JSON.parse(fs.readFileSync(dataFile, 'utf8')) }; } catch (e) { log('não deu para ler os dados da sala:', e.message); }
    let saveT = null; const saveStore = () => { if (!dataFile || saveT) return; saveT = setTimeout(() => { saveT = null; try { fs.writeFileSync(dataFile, JSON.stringify(store)); } catch (e) { log('não deu para salvar os dados da sala:', e.message); } }, 400); };
    const lc = (n) => String(n || '').trim().toLowerCase();
    /* ---- AS CASAS (28/10, Erling: "a casa fica salva no MEU servidor, não no save do cara"; "mesmo quando eu reseto o servidor o
       save deve manter os dados de casa"). Arquivo próprio, ao lado dos dados da sala e NUNCA apagado junto com eles. O servidor é
       a referência (o "de-para"): posição, tamanho, andamento, dono. O chão é disputado: dois terrenos não se sobrepõem. ---- */
    const casasFile = opts.casasFile || (dataFile ? path.join(path.dirname(dataFile), 'casas-dados.json') : null);
    let casas = {}, sold = {}; try { if (casasFile && fs.existsSync(casasFile)) { const j = JSON.parse(fs.readFileSync(casasFile, 'utf8')) || {}; if (j.v === 2) { casas = j.houses || {}; sold = j.sold || {}; } else casas = j; } } catch (e) { log('não deu para ler as casas:', e.message); }
    let casaT = null; const saveCasas = () => { if (!casasFile || casaT) return; casaT = setTimeout(() => { casaT = null; try { const tmp = casasFile + '.tmp'; fs.writeFileSync(tmp, JSON.stringify({ v: 2, houses: casas, sold }, null, 1)); fs.renameSync(tmp, casasFile); } catch (e) { log('não deu para salvar as casas:', e.message); } }, 800); };
    const casaKey = (acc, char) => acc + '|' + lc(char);
    const num = (v) => Number.isFinite(+v) ? +v : null;
    const casaOf = (h) => casas[casaKey(h.acc, h.char)] || null;
    const casaList = () => Object.values(casas).map((c) => ({ char: c.char, nick: c.nick, name: c.name, gx: c.gx, gy: c.gy, w: c.w, h: c.h, done: c.done >= c.work, signed: !!c.signed }));
    const deedOk = (d) => typeof d === 'string' && /^[a-z0-9]{6,16}$/.test(d);
    const deedMeta = (c) => ({ id: c.deedId, house: c.name, owner: c.owner || c.char, gx: c.gx, gy: c.gy, w: c.w, h: c.h, since: c.since });
    const hubOf = (acc, char) => [...hubs].find((x) => x.acc === acc && lc(x.char) === lc(char));
    const overlapC = (a, b) => a.gx < b.gx + b.w + 1 && a.gx + a.w + 1 > b.gx && a.gy < b.gy + b.h + 1 && a.gy + a.h + 1 > b.gy;
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


    /* ================= CONTAS, AMIGOS E GUILDAS (26/10) =================
       A amizade é da CONTA (o jogador), não do personagem: a conta nasce na máquina (id + chave) e o servidor guarda
       amigos, pedidos e conversas. Quem está no menu (fora do mundo) também conversa: o "hub" é uma segunda conexão, leve,
       sem personagem no mapa. As guildas são dos personagens (cada personagem é um universo) e moram neste servidor. */
    const hubs = new Set(); // conexões leves: { ws, acc, char, where }
    const sha = (x) => crypto.createHash('sha256').update(String(x)).digest('hex');
    const A = (id) => store.accounts[id] || null;
    const pubAcc = (id) => { const a = A(id); return a ? { id, nick: a.nick } : null; };
    function connsOf(id) { const out = []; for (const h of hubs) if (h.acc === id) out.push(h); return out; }
    function presence(id) { const c = connsOf(id); if (!c.length) { const a = A(id); return { on: false, seen: a ? a.seen : 0 }; } const inW = c.find((h) => h.where === 'mundo'); return { on: true, where: inW ? 'mundo' : 'menu', char: (inW || c[0]).char || '' }; }
    function sendAcc(id, m) { for (const h of connsOf(id)) send(h.ws, m); }
    function friendsMsg(id) { const a = A(id); if (!a) return { t: 'a:friends', list: [], reqIn: [], reqOut: [] }; return { t: 'a:friends', list: a.friends.map((f) => ({ ...pubAcc(f), ...presence(f) })).filter((x) => x.id), reqIn: a.reqIn.map(pubAcc).filter(Boolean), reqOut: a.reqOut.map(pubAcc).filter(Boolean) }; }
    function pushFriendsOf(id) { const a = A(id); if (!a) return; for (const f of a.friends) sendAcc(f, friendsMsg(f)); }
    function auth(acc) { if (!acc || typeof acc.id !== 'string' || typeof acc.key !== 'string' || acc.id.length > 64) return null; let a = A(acc.id); const kh = sha(acc.key);
      if (!a) { let nick = String(acc.nick || 'Caminhante').replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 20).trim() || 'Caminhante'; const taken = (n) => Object.values(store.accounts).some((x) => x.nick.toLowerCase() === n.toLowerCase()); let n2 = nick, k = 1; while (taken(n2)) n2 = `${nick}#${++k}`;
        a = store.accounts[acc.id] = { nick: n2, kh, friends: [], reqIn: [], reqOut: [], seen: Date.now() }; saveStore(); }
      else if (a.kh !== kh) return 'bad'; return a; }
    const charKey = (n) => lc(n);
    function guildOf(char) { const k = charKey(char); for (const g of Object.values(store.guilds)) if (g.members[k]) return g; return null; }
    const RANKS = ['recruta', 'membro', 'oficial', 'lider'];
    const rankN = (g, char) => RANKS.indexOf((g.members[charKey(char)] || {}).rank);
    function guildMsg(g) { return { t: 'g:info', g: g ? { id: g.id, name: g.name, tag: g.tag, col: g.col, plot: g.plot, motd: g.motd, created: g.created, members: Object.entries(g.members).map(([k, m]) => ({ k, name: m.name, rank: m.rank, joined: m.joined, ...(m.acc ? presence(m.acc) : { on: false }) })), market: g.market, log: g.log.slice(-60) } : null }; }
    function worldGuilds() { return { t: 'g:world', list: Object.values(store.guilds).map((g) => ({ id: g.id, name: g.name, tag: g.tag, col: g.col, plot: g.plot, build: g.build })) }; }
    function toGuild(g, m) { const ks = new Set(Object.keys(g.members)); for (const h of hubs) if (h.char && ks.has(charKey(h.char))) send(h.ws, m); }
    const pushGuild = (g) => toGuild(g, guildMsg(g));
    const pushWorld = () => { const m = worldGuilds(); for (const h of hubs) send(h.ws, m); };
    const ginv = new Map(); // personagem convidado → { gid, from, at }
    function hubMsg(h, m) {
      const me = A(h.acc); if (!me) return; me.seen = Date.now();
      switch (m.t) {
        case 'a:where': { h.char = String(m.char || '').slice(0, 24); h.where = m.where === 'mundo' ? 'mundo' : 'menu'; pushFriendsOf(h.acc); send(h.ws, guildMsg(h.char ? guildOf(h.char) : null)); break; }
        case 'a:nick': { const n = String(m.nick || '').replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 20).trim(); if (n.length < 3) { send(h.ws, { t: 'a:sys', text: 'O apelido precisa de pelo menos 3 letras.' }); break; } if (Object.entries(store.accounts).some(([id, x]) => id !== h.acc && x.nick.toLowerCase() === n.toLowerCase())) { send(h.ws, { t: 'a:sys', text: `O apelido ${n} já é de outro jogador.` }); break; } me.nick = n; saveStore(); sendAcc(h.acc, { t: 'a:me', id: h.acc, nick: n }); pushFriendsOf(h.acc); break; }
        case 'a:freq': { let to = null; if (m.nick) to = Object.keys(store.accounts).find((id) => store.accounts[id].nick.toLowerCase() === String(m.nick).toLowerCase()); if (!to && m.char) { const c = [...hubs].find((x) => x.char && lc(x.char) === lc(m.char)); if (c) to = c.acc; }
          if (!to) { send(h.ws, { t: 'a:sys', text: m.char ? `${m.char} não está com a conta conectada agora.` : `Nenhum jogador com o apelido ${m.nick}.` }); break; } if (to === h.acc) break; const T = A(to);
          if (me.friends.includes(to)) { send(h.ws, { t: 'a:sys', text: `${T.nick} já é seu amigo.` }); break; }
          if (me.reqIn.includes(to)) { me.reqIn = me.reqIn.filter((x) => x !== to); T.reqOut = T.reqOut.filter((x) => x !== h.acc); me.friends.push(to); T.friends.push(h.acc); saveStore(); sendAcc(h.acc, friendsMsg(h.acc)); sendAcc(to, friendsMsg(to)); sendAcc(to, { t: 'a:sys', text: `${me.nick} agora é seu amigo.` }); break; }
          if (!me.reqOut.includes(to)) me.reqOut.push(to); if (!T.reqIn.includes(h.acc)) T.reqIn.push(h.acc); saveStore(); sendAcc(h.acc, friendsMsg(h.acc)); sendAcc(to, friendsMsg(to)); sendAcc(to, { t: 'a:freq', from: pubAcc(h.acc) }); send(h.ws, { t: 'a:sys', text: `Pedido de amizade enviado para ${T.nick}.` }); break; }
        case 'a:fans': { const from = String(m.id || ''); const F = A(from); if (!F || !me.reqIn.includes(from)) break; me.reqIn = me.reqIn.filter((x) => x !== from); F.reqOut = F.reqOut.filter((x) => x !== h.acc);
          if (m.ok) { if (!me.friends.includes(from)) me.friends.push(from); if (!F.friends.includes(h.acc)) F.friends.push(h.acc); sendAcc(from, { t: 'a:sys', text: `${me.nick} aceitou a sua amizade.` }); } saveStore(); sendAcc(h.acc, friendsMsg(h.acc)); sendAcc(from, friendsMsg(from)); break; }
        case 'a:fdel': { const o = String(m.id || ''); const O = A(o); me.friends = me.friends.filter((x) => x !== o); me.reqOut = me.reqOut.filter((x) => x !== o); if (O) { O.friends = O.friends.filter((x) => x !== h.acc); O.reqIn = O.reqIn.filter((x) => x !== h.acc); } saveStore(); sendAcc(h.acc, friendsMsg(h.acc)); if (O) sendAcc(o, friendsMsg(o)); break; }
        case 'a:dm': { const to = String(m.to || ''); const T = A(to); const text = String(m.text || '').slice(0, 500).trim(); if (!T || !text) break; if (!me.friends.includes(to)) { send(h.ws, { t: 'a:sys', text: 'Só dá para conversar com amigos.' }); break; }
          const msg = { t: 'a:dm', from: h.acc, fromNick: me.nick, to, text, at: Date.now() }; if (connsOf(to).length) sendAcc(to, msg); else { (store.dmq[to] ||= []).push(msg); if (store.dmq[to].length > 200) store.dmq[to].shift(); saveStore(); } sendAcc(h.acc, msg); break; }
        case 'a:list': send(h.ws, friendsMsg(h.acc)); break;
        case 'h:get': { if (!h.char) break; const sk = casaKey(h.acc, h.char); if (sold[sk]) { send(h.ws, { t: 'h:sold', ...sold[sk] }); delete sold[sk]; saveCasas(); } send(h.ws, { t: 'h:mine', house: casaOf(h) }); send(h.ws, { t: 'h:all', list: casaList() }); break; }
        case 'h:sync': { if (!h.char) break; const c = m.house || {}; const k = casaKey(h.acc, h.char), old = casas[k]; if (sold[k]) { send(h.ws, { t: 'h:sold', ...sold[k] }); delete sold[k]; saveCasas(); break; }
          const v = { gx: num(c.gx), gy: num(c.gy), w: num(c.w), h: num(c.h), work: num(c.work), done: num(c.done) }; if (Object.values(v).some((x) => x === null) || v.w < 1 || v.h < 1 || v.w > 12 || v.h > 12) break;
          const clash = Object.entries(casas).find(([kk, o]) => kk !== k && overlapC(v, o));
          if (clash) { send(h.ws, { t: 'h:deny', why: `Esse chão já é de ${clash[1].char} (${clash[1].name}).`, house: old || null }); break; }
          if (old && (old.gx !== v.gx || old.gy !== v.gy) && old.done >= old.work) { send(h.ws, { t: 'h:mine', house: old }); break; } /* casa pronta não muda de lugar pelo save do jogador */
          casas[k] = { ...v, id: String(c.id || 'casa').slice(0, 32), name: String(c.name || 'Casa').slice(0, 48), signed: !!c.signed, owner: String(c.owner || h.char).slice(0, 24), contract: !!c.contract,
            robots: Array.isArray(c.robots) ? c.robots.slice(0, 4) : [], deedId: old?.deedId || (deedOk(c.deedId) ? c.deedId : undefined), char: h.char, nick: me.nick, acc: h.acc, since: old?.since || Date.now(), at: Date.now() };
          saveCasas(); const L = { t: 'h:all', list: casaList() }; for (const x of hubs) send(x.ws, L); break; }
        /* a escritura: quem a tem e assina o contrato toma posse da casa (28/10). O antigo dono é avisado e a casa sai do mundo dele */
        case 'h:deed': { const d = String(m.id || ''); const f = Object.values(casas).find((c) => c.deedId === d); send(h.ws, { t: 'h:deedinfo', deed: f ? deedMeta(f) : null, id: d }); break; }
        case 'h:transfer': { if (!h.char) break; const d = String(m.id || ''); const e = Object.entries(casas).find(([, c]) => c.deedId === d);
          if (!e) { send(h.ws, { t: 'h:tdeny', why: 'O Cartório não encontrou a casa desta escritura.' }); break; } const [ok0, c] = e, nk = casaKey(h.acc, h.char);
          if (ok0 === nk) { send(h.ws, { t: 'h:tdeny', why: 'Esta casa já é sua.' }); break; }
          if (casas[nk]) { send(h.ws, { t: 'h:tdeny', why: 'Você já tem uma casa (ou uma obra). Por enquanto, uma por personagem.' }); break; }
          const prev = c.char; casas[nk] = { ...c, acc: h.acc, char: h.char, nick: me.nick, owner: h.char, at: Date.now(), from: prev }; delete casas[ok0];
          sold[ok0] = { deedId: d, to: h.char, name: c.name, at: Date.now() }; saveCasas(); log(`casa ${c.name} (${d}) passou de ${prev} para ${h.char}`);
          const oh = hubOf(ok0.split('|')[0], prev); if (oh) { send(oh.ws, { t: 'h:sold', ...sold[ok0] }); delete sold[ok0]; saveCasas(); }
          send(h.ws, { t: 'h:mine', house: casas[nk], bought: true }); const L = { t: 'h:all', list: casaList() }; for (const x of hubs) send(x.ws, L); break; }
        case 'h:del': { if (!h.char) break; const k = casaKey(h.acc, h.char); if (casas[k] && casas[k].done < casas[k].work) { delete casas[k]; saveCasas(); const L = { t: 'h:all', list: casaList() }; for (const x of hubs) send(x.ws, L); } break; }
        /* 26/10 (Erling): o CORREIO DA CONTA — compras do Shop e cartas entre jogadores chegam aqui, fora do mundo; o jogador decide
           para qual personagem mandar os anexos (aí vão para a caixa de correio daquele personagem) */
        case 'a:mlist': send(h.ws, { t: 'a:mail', list: store.amail[h.acc] || [] }); break;
        case 'a:mshop': { const subj = String(m.subj || '').slice(0, 80), text = String(m.text || '').slice(0, 1500); const att = Array.isArray(m.att) ? m.att.slice(0, 6) : [];
          (store.amail[h.acc] ||= []).push({ id: store.amseq++, from: 'Shop de Askavik', subj, text, att, t: Date.now() }); saveStore(); sendAcc(h.acc, { t: 'a:mail', list: store.amail[h.acc], fresh: true }); break; }
        case 'a:msend': { const to = String(m.to || ''); const T = A(to); const subj = String(m.subj || '').slice(0, 80).trim() || '(sem assunto)', text = String(m.text || '').slice(0, 1500).trim(); if (!T || !text) break;
          if (!me.friends.includes(to)) { send(h.ws, { t: 'a:sys', text: 'Cartas da conta só vão para amigos.' }); break; }
          (store.amail[to] ||= []).push({ id: store.amseq++, from: me.nick, fromId: h.acc, subj, text, att: Array.isArray(m.att) ? m.att.slice(0, 6) : [], t: Date.now() }); if (store.amail[to].length > 100) store.amail[to].shift(); saveStore();
          sendAcc(to, { t: 'a:mail', list: store.amail[to], fresh: true }); send(h.ws, { t: 'a:sys', text: `Carta enviada para ${T.nick}.` }); break; }
        case 'a:mtake': { const L = store.amail[h.acc] || []; const i = L.findIndex((x) => x.id === m.id); if (i < 0) break; if (m.del) L.splice(i, 1); else { L[i].att = []; L[i].read = true; } saveStore(); sendAcc(h.acc, { t: 'a:mail', list: L }); break; }
        case 'a:mread': { const L = store.amail[h.acc] || []; const x = L.find((q) => q.id === m.id); if (x) { x.read = true; saveStore(); } break; }
        /* ---------- guildas ---------- */
        case 'g:create': { const char = h.char; if (!char) break; if (guildOf(char)) { send(h.ws, { t: 'a:sys', text: 'Você já está em uma guilda.' }); break; }
          const name = String(m.name || '').replace(/[<>]/g, '').slice(0, 28).trim(), tag = String(m.tag || '').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 4).toUpperCase();
          if (name.length < 3 || tag.length < 2) { send(h.ws, { t: 'g:fail', why: 'O nome precisa de 3 letras e a sigla de 2 a 4.' }); break; }
          if (Object.values(store.guilds).some((g) => g.name.toLowerCase() === name.toLowerCase() || g.tag === tag)) { send(h.ws, { t: 'g:fail', why: 'Já existe uma guilda com esse nome ou essa sigla.' }); break; }
          const used = new Set(Object.values(store.guilds).map((g) => g.plot)); let plot = 0; while (used.has(plot)) plot++;
          const g = { id: store.gseq++, name, tag, col: /^#[0-9a-f]{6}$/i.test(m.col) ? m.col : '#b8924a', created: Date.now(), plot, motd: 'Bem-vindos.', members: { [charKey(char)]: { name: char, acc: h.acc, rank: 'lider', joined: Date.now() } }, market: [], build: Array.isArray(m.seed) ? m.seed.slice(0, 120) : [], log: [{ at: Date.now(), sys: 1, text: `${char} fundou a guilda ${name}.` }] };
          store.guilds[g.id] = g; saveStore(); send(h.ws, { t: 'g:ok', id: g.id }); pushGuild(g); pushWorld(); break; }
        case 'g:inv': { const g = guildOf(h.char); if (!g || rankN(g, h.char) < 2) { send(h.ws, { t: 'a:sys', text: 'Só líder e oficiais convidam para a guilda.' }); break; } const to = String(m.char || ''); if (guildOf(to)) { send(h.ws, { t: 'a:sys', text: `${to} já está numa guilda.` }); break; }
          const c = [...hubs].filter((x) => x.char && lc(x.char) === lc(to)); if (!c.length) { send(h.ws, { t: 'a:sys', text: `${to} não está conectado agora.` }); break; }
          ginv.set(lc(to), { gid: g.id, from: h.char, at: Date.now() }); for (const x of c) send(x.ws, { t: 'g:inv', gid: g.id, name: g.name, tag: g.tag, col: g.col, from: h.char }); send(h.ws, { t: 'a:sys', text: `Convite da guilda enviado para ${to}.` }); break; }
        case 'g:ans': { const iv = ginv.get(lc(h.char)); ginv.delete(lc(h.char)); const g = iv && store.guilds[iv.gid]; if (!g || Date.now() - iv.at > 180000) { send(h.ws, { t: 'a:sys', text: 'Esse convite expirou.' }); break; } if (!m.ok) { toGuild(g, { t: 'g:chat', sys: 1, text: `${h.char} recusou o convite.`, at: Date.now() }); break; } if (guildOf(h.char)) break;
          g.members[charKey(h.char)] = { name: h.char, acc: h.acc, rank: 'recruta', joined: Date.now() }; const L = { at: Date.now(), sys: 1, text: `${h.char} entrou na guilda.` }; g.log.push(L); saveStore(); toGuild(g, { t: 'g:chat', ...L }); pushGuild(g); break; }
        case 'g:leave': { const g = guildOf(h.char); if (!g) break; delete g.members[charKey(h.char)]; const L = { at: Date.now(), sys: 1, text: `${h.char} saiu da guilda.` }; g.log.push(L);
          if (!Object.keys(g.members).length) { delete store.guilds[g.id]; saveStore(); send(h.ws, guildMsg(null)); pushWorld(); break; }
          if (!Object.values(g.members).some((x) => x.rank === 'lider')) { const nx = Object.values(g.members).sort((a, b) => RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank) || a.joined - b.joined)[0]; nx.rank = 'lider'; g.log.push({ at: Date.now(), sys: 1, text: `${nx.name} agora lidera a guilda.` }); }
          saveStore(); send(h.ws, guildMsg(null)); toGuild(g, { t: 'g:chat', ...L }); pushGuild(g); break; }
        case 'g:kick': { const g = guildOf(h.char); const tk = charKey(m.char || ''); if (!g || !g.members[tk] || rankN(g, h.char) < 2 || RANKS.indexOf(g.members[tk].rank) >= rankN(g, h.char)) break; const nm = g.members[tk].name; delete g.members[tk]; const L = { at: Date.now(), sys: 1, text: `${nm} foi removido da guilda por ${h.char}.` }; g.log.push(L); saveStore();
          for (const x of hubs) if (x.char && charKey(x.char) === tk) { send(x.ws, guildMsg(null)); send(x.ws, { t: 'a:sys', text: `Você foi removido da guilda ${g.name}.` }); } toGuild(g, { t: 'g:chat', ...L }); pushGuild(g); break; }
        case 'g:rank': { const g = guildOf(h.char); const tk = charKey(m.char || ''); const r = String(m.rank); if (!g || !g.members[tk] || rankN(g, h.char) < 3 || !RANKS.includes(r) || tk === charKey(h.char)) break;
          if (r === 'lider') g.members[charKey(h.char)].rank = 'oficial'; g.members[tk].rank = r; const L = { at: Date.now(), sys: 1, text: `${g.members[tk].name} agora é ${r}.` }; g.log.push(L); saveStore(); toGuild(g, { t: 'g:chat', ...L }); pushGuild(g); break; }
        case 'g:motd': { const g = guildOf(h.char); if (!g || rankN(g, h.char) < 2) break; g.motd = String(m.text || '').slice(0, 200); saveStore(); pushGuild(g); break; }
        case 'g:chat': { const g = guildOf(h.char); const text = String(m.text || '').slice(0, 300).trim(); if (!g || !text) break; const L = { at: Date.now(), from: h.char, text }; g.log.push(L); if (g.log.length > 200) g.log.splice(0, g.log.length - 200); saveStore(); toGuild(g, { t: 'g:chat', ...L }); break; }
        case 'g:mk:add': { const g = guildOf(h.char); if (!g || rankN(g, h.char) < 1) { send(h.ws, { t: 'a:sys', text: 'Recrutas ainda não vendem no mercado da guilda.' }); break; } const price = Math.max(1, Math.min(1e7, Math.floor(Number(m.price) || 0))); const att = m.att; if (!att || (!att.item && !att.gear)) break;
          if (g.market.filter((x) => lc(x.by) === lc(h.char)).length >= 10) { post(sysLetter(h.char, 'Mercado da guilda cheio', 'No máximo 10 ofertas suas ao mesmo tempo. O item voltou.', [att])); break; }
          g.market.push({ id: store.pid++, by: h.char, att, price, at: Date.now() }); saveStore(); pushGuild(g); break; }
        case 'g:mk:buy': { const g = guildOf(h.char); if (!g) break; const i = g.market.findIndex((x) => x.id === m.id); if (i < 0) { post(sysLetter(h.char, 'Oferta já vendida', 'Alguém comprou antes. O seu ouro voltou.', [{ gold: Math.max(0, Math.floor(Number(m.paid) || 0)) }])); break; }
          const o = g.market.splice(i, 1)[0]; saveStore(); post(sysLetter(h.char, `Mercado da guilda: ${o.att.item ? o.att.item.n + '× ' + o.att.item.id : (o.att.gear && o.att.gear.name) || 'item'}`, `Comprado de ${o.by} no mercado da ${g.name}.`, [o.att]));
          post(sysLetter(o.by, 'Mercado da guilda: venda', `${h.char} comprou a sua oferta por ${o.price} de ouro. A guilda não cobra taxa dos seus.`, [{ gold: o.price }])); pushGuild(g); break; }
        case 'g:mk:del': { const g = guildOf(h.char); if (!g) break; const i = g.market.findIndex((x) => x.id === m.id && (lc(x.by) === lc(h.char) || rankN(g, h.char) >= 3)); if (i < 0) break; const o = g.market.splice(i, 1)[0]; saveStore(); post(sysLetter(o.by, 'Oferta retirada', 'A oferta saiu do mercado da guilda. O item voltou.', [o.att])); pushGuild(g); break; }
        case 'g:build': { const g = guildOf(h.char); if (!g || rankN(g, h.char) < 1) { send(h.ws, { t: 'a:sys', text: 'Recrutas ainda não constroem no terreno da guilda.' }); break; } const b = m.b; if (!b || typeof b.gx !== 'number') break;
          if (m.del) { const j = g.build.map((x, k) => [x, k]).reverse().find(([x]) => x.gx === b.gx && x.gy === b.gy); if (j) g.build.splice(j[1], 1); } else { if (g.build.length >= 400) { send(h.ws, { t: 'a:sys', text: 'O terreno da guilda já tem 400 peças.' }); break; } g.build.push({ kind: String(b.kind).slice(0, 12), gx: b.gx | 0, gy: b.gy | 0, v: b.v | 0 }); }
          saveStore(); pushWorld(); break; }
      }
    }
    web.on('error', (e) => reject(e));
    web.listen(port, '0.0.0.0', () => { log(`sala aberta na porta ${port} · convite ${code}`); resolve({ port, code, stop, restart, players: () => [...players.values()].map(info), version: manifest ? manifest.version : null }); });
    wss.on('connection', (ws, req) => {
      let me = null, hubConn = null;
      const ip = req.socket.remoteAddress;
      const bye = setTimeout(() => { if (!me) ws.close(4001, 'sem apresentação'); }, 8000);
      ws.on('message', (raw) => {
        let m; try { m = JSON.parse(String(raw)); } catch { return; }
        if (!me && hubConn) { hubMsg(hubConn, m); return; }
        if (!me && m.t === 'a:hello') { // conexão leve da conta (menu, amigos, guilda)
          if (String(m.code || '').toUpperCase() !== code || (opts.password && String(m.pass || '') !== String(opts.password))) { send(ws, { t: 'a:deny', why: 'Convite ou senha errados.' }); ws.close(); return; }
          const a = auth(m.acc); if (!a || a === 'bad') { send(ws, { t: 'a:deny', why: a === 'bad' ? 'Esta conta já existe com outra chave neste servidor.' : 'Conta inválida.' }); ws.close(); return; }
          clearTimeout(bye); hubConn = { ws, acc: m.acc.id, char: String(m.char || '').slice(0, 24), where: m.where === 'mundo' ? 'mundo' : 'menu' }; hubs.add(hubConn); a.seen = Date.now();
          send(ws, { t: 'a:me', id: m.acc.id, nick: a.nick }); send(ws, friendsMsg(m.acc.id)); send(ws, guildMsg(hubConn.char ? guildOf(hubConn.char) : null)); send(ws, worldGuilds()); send(ws, { t: 'a:mail', list: store.amail[m.acc.id] || [] });
          const q = store.dmq[m.acc.id]; if (q && q.length) { for (const x of q) send(ws, x); delete store.dmq[m.acc.id]; } saveStore(); pushFriendsOf(m.acc.id); return; }
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
        if (hubConn) { hubs.delete(hubConn); const a = A(hubConn.acc); if (a) a.seen = Date.now(); pushFriendsOf(hubConn.acc); hubConn = null; return; }
        if (!me) return;
        leaveParty(me, 'deixou o mundo'); players.delete(me.id); others(me.id, { t: 'leave', id: me.id, name: me.name });
        if (me.host) { const next = players.values().next().value; if (next) { next.host = true; for (const p of players.values()) send(p.ws, { t: 'host', id: next.id }); } }
        log(`${me.name} saiu · ${players.size} na sala`);
      });
    });
    // mantém conexões vivas atrás de roteadores que derrubam silêncio
    const beat = setInterval(() => { for (const p of players.values()) if (p.ws.readyState === 1) p.ws.ping(); }, 20000);
    /* 26/10 (Erling: "o server precisa dizer que em 10 s vai reiniciar; a tela esmaece, o loading vem, termina para todos e o server
       volta com todo mundo logado"): aviso com contagem para todos, e os clientes esperam a sala voltar e entram sozinhos */
    let restarting = null;
    function restart(sec = 10, why = 'reiniciar', then = () => process.exit(0)) {
      if (restarting) return; restarting = { sec };
      log(`${why} em ${sec} s — avisando ${players.size} jogador(es)`);
      const tick = () => { for (const p of players.values()) send(p.ws, { t: 'restart', sec: restarting.sec, why }); for (const h of hubs) send(h.ws, { t: 'restart', sec: restarting.sec, why });
        if (restarting.sec <= 0) { saveStore(); for (const p of players.values()) { send(p.ws, { t: 'closed', why: 'A sala está reiniciando. Já volta.', restart: true }); try { p.ws.close(); } catch { /* */ } } setTimeout(then, 300); return; }
        restarting.sec--; setTimeout(tick, 1000); };
      tick();
    }
    /* o jogo mudou no dist: manda todo mundo atualizar (a sala não cai; cada um baixa o que mudou e volta) */
    let updateAnn = null;
    function announceUpdate(version) { if (updateAnn) return; updateAnn = { sec: 10 };
      const tick = () => { for (const p of players.values()) send(p.ws, { t: 'update', sec: updateAnn.sec, version }); if (updateAnn.sec <= 0) { updateAnn = null; return; } updateAnn.sec--; setTimeout(tick, 1000); }; tick(); }
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
  startServer({ port, code: flag('codigo') || pos[1], gameDir, password, dataFile, name: flag('nome') }).then((room) => {
    /* Ctrl+C: avisa os jogadores e só então cai (um segundo Ctrl+C fecha na hora). No terminal: `reiniciar [segundos]` faz o mesmo; `quem` lista quem está dentro */
    let pressed = 0; const bye = () => { if (pressed++) process.exit(0); room.restart(10, 'reiniciar'); }; process.on('SIGINT', bye); process.on('SIGTERM', bye);
    if (process.stdin.isTTY) { process.stdin.setEncoding('utf8'); process.stdin.on('data', (line) => { const [c, a] = String(line).trim().split(/\s+/); if (c === 'reiniciar') room.restart(Math.max(0, Number(a) || 10), 'reiniciar'); else if (c === 'quem') console.log('[karmika] dentro:', room.players().map((p) => p.name).join(', ') || 'ninguém'); else if (c === 'sair') room.restart(Math.max(0, Number(a) || 10), 'fechar'); }); }
  }).catch((e) => { console.error('Não deu para abrir a sala:', e.message); process.exit(1); });
}
