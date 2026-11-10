/* Inscrição no beta (10/11, Erling: "do mesmo jeito que fizemos na Tagged"): cada inscrição vira um e-mail pelo FormSubmit,
   enviado daqui do servidor (o endereço fica na variável KARMIKA_FORM_EMAIL da Vercel e nunca aparece na página).
   Na primeira inscrição o FormSubmit manda um e-mail pedindo para ativar o formulário: é só clicar em "Activate".
   Se a loja Vercel Blob "karmika-beta" estiver ligada ao projeto, a inscrição também fica guardada lá.
   10/11: o pacote da loja é carregado só na hora (antes, a falta dele derrubava a função inteira e nenhum e-mail saía). */

const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

/* 10/11: o mesmo e-mail não dispara outro aviso em 10 min (memória da instância; a trava principal está no botão do site) */
const recent = new Map();
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'método' });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  if (b.site) return res.status(200).json({ ok: true }); /* robô preencheu o campo escondido */
  const email = clean(b.email, 120).toLowerCase(), nome = clean(b.nome, 60);
  if (!nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !b.ok) return res.status(400).json({ error: 'dados' });
  const now = Date.now(); for (const [k, t] of recent) if (now - t > 600000) recent.delete(k);
  if (recent.has(email)) return res.status(200).json({ ok: true, dup: true });
  const row = { nome, email, discord: clean(b.discord, 60), caminho: clean(b.caminho, 40), pc: clean(b.pc, 120), embaixador: !!b.embaixador, quando: new Date().toISOString(), pais: req.headers['x-vercel-ip-country'] || '' };
  let sent = false, saved = false;
  const to = process.env.KARMIKA_FORM_EMAIL;
  if (to) {
    try {
      const r = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json', referer: 'https://karmikaonline.com/', origin: 'https://karmikaonline.com', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' },
        body: JSON.stringify({ _subject: `KARMIKA beta: ${nome}${row.embaixador ? ' (embaixador)' : ''}`, _template: 'table', _captcha: 'false', _replyto: email,
          Nome: nome, 'E-mail': email, Discord: row.discord || '-', Caminho: row.caminho, PC: row.pc || '-', Embaixador: row.embaixador ? 'sim' : 'não', País: row.pais || '-', Quando: row.quando }) });
      const j = await r.json().catch(() => ({}));
      sent = r.ok && String(j.success) !== 'false';
      if (!sent) console.error('beta: formsubmit', r.status, j);
    } catch (e) { console.error('beta: formsubmit', e); }
  }
  /* 10/11: segunda via de e-mail, a Web3Forms (a chave vem por e-mail na hora, sem link de ativação): variável WEB3FORMS_KEY na Vercel */
  const w3 = process.env.WEB3FORMS_KEY;
  if (!sent && w3) {
    try {
      const r = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ access_key: w3, subject: `KARMIKA beta: ${nome}${row.embaixador ? ' (embaixador)' : ''}`, from_name: 'KARMIKA beta', replyto: email,
          Nome: nome, 'E-mail': email, Discord: row.discord || '-', Caminho: row.caminho, PC: row.pc || '-', Embaixador: row.embaixador ? 'sim' : 'não', País: row.pais || '-', Quando: row.quando }) });
      const j = await r.json().catch(() => ({})); sent = r.ok && j.success !== false; if (!sent) console.error('beta: web3forms', r.status, j);
    } catch (e) { console.error('beta: web3forms', e); }
  }
  /* a inscrição também fica guardada na loja Vercel Blob (privada), sem pacote: a mesma chamada que o @vercel/blob faz */
  const tok = process.env.BLOB_READ_WRITE_TOKEN;
  if (tok) {
    try {
      const path = `beta/${row.quando.slice(0, 10)}-${email.replace(/[^a-z0-9]/g, '_')}.json`;
      const r = await fetch(`https://vercel.com/api/blob/?pathname=${encodeURIComponent(path)}`, { method: 'PUT', body: JSON.stringify(row),
        headers: { authorization: `Bearer ${tok}`, 'x-api-version': '13', 'x-vercel-blob-store-id': tok.split('_')[3] || '', 'x-vercel-blob-access': 'private', 'x-content-type': 'application/json', 'x-add-random-suffix': '1' } });
      saved = r.ok; if (!saved) console.error('beta: blob', r.status, await r.text().catch(() => ''));
    } catch (e) { console.error('beta: blob', e); }
  }
  if (sent || saved) { recent.set(email, now); return res.status(200).json({ ok: true }); }
  console.error('beta: nada gravou (falta KARMIKA_FORM_EMAIL ou a loja Blob)');
  return res.status(503).json({ error: 'envio' });
}
