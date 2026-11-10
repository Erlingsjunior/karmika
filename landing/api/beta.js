/* Inscrição no beta (10/11, Erling: "do mesmo jeito que fizemos na Tagged"): cada inscrição vira um e-mail pelo FormSubmit,
   enviado daqui do servidor (o endereço fica na variável KARMIKA_FORM_EMAIL da Vercel e nunca aparece na página).
   Na primeira inscrição o FormSubmit manda um e-mail pedindo para ativar o formulário: é só clicar em "Activate".
   Se a loja Vercel Blob "karmika-beta" estiver ligada ao projeto, a inscrição também fica guardada lá. */
import { put } from '@vercel/blob';

const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'método' });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  if (b.site) return res.status(200).json({ ok: true }); /* robô preencheu o campo escondido */
  const email = clean(b.email, 120).toLowerCase(), nome = clean(b.nome, 60);
  if (!nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !b.ok) return res.status(400).json({ error: 'dados' });
  const row = { nome, email, discord: clean(b.discord, 60), caminho: clean(b.caminho, 40), pc: clean(b.pc, 120), embaixador: !!b.embaixador, quando: new Date().toISOString(), pais: req.headers['x-vercel-ip-country'] || '' };
  let sent = false, saved = false;
  const to = process.env.KARMIKA_FORM_EMAIL;
  if (to) {
    try {
      const r = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json', referer: 'https://karmikaonline.com/', origin: 'https://karmikaonline.com' },
        body: JSON.stringify({ _subject: `KARMIKA beta: ${nome}${row.embaixador ? ' (embaixador)' : ''}`, _template: 'table', _captcha: 'false', _replyto: email,
          Nome: nome, 'E-mail': email, Discord: row.discord || '-', Caminho: row.caminho, PC: row.pc || '-', Embaixador: row.embaixador ? 'sim' : 'não', País: row.pais || '-', Quando: row.quando }) });
      const j = await r.json().catch(() => ({}));
      sent = r.ok && String(j.success) !== 'false';
      if (!sent) console.error('beta: formsubmit', r.status, j);
    } catch (e) { console.error('beta: formsubmit', e); }
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try { await put(`beta/${row.quando.slice(0, 10)}-${email.replace(/[^a-z0-9]/g, '_')}.json`, JSON.stringify(row), { access: 'private', contentType: 'application/json', addRandomSuffix: true }); saved = true; }
    catch (e) { console.error('beta: blob', e); }
  }
  if (sent || saved) return res.status(200).json({ ok: true });
  console.error('beta: nada gravou (falta KARMIKA_FORM_EMAIL ou a loja Blob)');
  return res.status(503).json({ error: 'envio' });
}
