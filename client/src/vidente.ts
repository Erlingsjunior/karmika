/* Hrefna, a Vidente dos Caminhos (Askavik, nível 30): doze perguntas, a revelação e a escolha livre.
   "O que eu vi é o que a sua alma inclina, não uma corrente. Em Karmika, quem escolhe é você." */
export type PathId = 'gue' | 'pal' | 'cac' | 'tec' | 'vam' | 'lob' | 'mag' | 'bru';
export interface PathDef { id: PathId; name: string; cls: string; mentor: string; place: string; village: string; col: string; line: string }
export const PATHS: PathDef[] = [
  { id: 'gue', name: 'Guerreiro', cls: 'Guerreiro do Norte', mentor: 'Thorgrim Mão-de-Ferro', place: 'Fortaleza de Odin, em Jarlsheim', village: 'Jarlsheim', col: '#c8a070', line: 'Vejo neve, um machado e um juramento. Você não recua, e quem está atrás de você sabe disso.' },
  { id: 'pal', name: 'Paladino', cls: 'Paladino de Auréon', mentor: 'Grão-Mestre Cassius', place: 'Abadia da Aurora, em Austrvik', village: 'Austrvik', col: '#ffe08a', line: 'Vejo uma luz que não queima, só aquece. Você fica entre o mal e quem não pode se defender.' },
  { id: 'cac', name: 'Caçador de Demônios', cls: 'Caçador de Demônios', mentor: 'Mestra Ilsa Van Rhal', place: 'Bastião de Prata do Clã Helsing, em Sudrholt', village: 'Sudrholt', col: '#d8dce4', line: 'Vejo prata, uma besta e a noite inteira acordada. O que se esconde no escuro aprendeu a temer o seu passo.' },
  { id: 'tec', name: 'Tecnocrata', cls: 'Tecnocrata', mentor: 'Arquiteta Ylva', place: 'Academia Tecnológica, em Askavik', village: 'Askavik', col: '#8ad0ff', line: 'Vejo engrenagens girando onde os outros só veem pedra. Você não aceita o mundo como ele é: você o monta de novo.' },
  { id: 'vam', name: 'Vampiro', cls: 'Vampiro', mentor: 'Conde Vladislav III', place: 'castelo da Colina Vampírica, perto de Corvoscuro', village: 'Corvoscuro', col: '#c43a3a', line: 'Vejo uma taça, uma noite que não acaba e um preço pago em gotas. Você quer o tempo, e o tempo tem dono.' },
  { id: 'lob', name: 'Lobisomem', cls: 'Lobisomem', mentor: 'Ulfrun, a Mãe-Alfa', place: 'tribo do Uivo Antigo, na Selva Licantropa', village: 'Uivo Antigo', col: '#b0a080', line: 'Vejo a lua cheia e um corpo que não cabe em si. A matilha já sentiu o seu cheiro.' },
  { id: 'mag', name: 'Mago', cls: 'Mago', mentor: 'Arquimago Aurelian Vesk', place: 'Pináculo de Marfim, em Lumenhal', village: 'Lumenhal', col: '#9ab4ff', line: 'Vejo uma torre de marfim acesa sobre a floresta. O saber chama você pelo nome, e você responde.' },
  { id: 'bru', name: 'Bruxo', cls: 'Bruxo', mentor: 'Malgrath, Senhor dos Pactos', place: 'Vale da Desgraça, em Gorvath', village: 'Gorvath', col: '#9b6ad0', line: 'Vejo um contrato escrito em fumaça. Você não pede poder: você negocia por ele.' },
];
type W = Partial<Record<PathId, number>>;
const Q: { q: string; a: [string, W][] }[] = [
  { q: 'Um lobo ferido atravessa o seu caminho à noite. Você…', a: [['cuida da ferida e o deixa ir', { pal: 2, lob: 1 }], ['acaba com o sofrimento dele, rápido', { gue: 2, cac: 1 }], ['segue o lobo até a toca, para ver aonde ele vai', { lob: 2, mag: 1 }], ['pensa que um lobo ferido ainda pode ser útil', { bru: 2, vam: 1, tec: 1 }]] },
  { q: 'O que você mais teme perder?', a: [['a honra', { gue: 2, pal: 1 }], ['o controle', { tec: 2, bru: 1 }], ['as pessoas que ama', { pal: 2, lob: 1 }], ['o tempo', { vam: 2, mag: 1 }]] },
  { q: 'Diante de uma porta trancada, você…', a: [['arromba', { gue: 2, lob: 1 }], ['estuda o mecanismo', { tec: 2, mag: 1 }], ['procura quem tem a chave, e o preço dela', { bru: 2, vam: 1 }], ['espera a noite e entra pela janela', { cac: 2, vam: 1 }]] },
  { q: 'Qual destes sons acalma você?', a: [['o martelo na bigorna', { gue: 2, tec: 1 }], ['o sino de uma igreja', { pal: 2, cac: 1 }], ['um uivo distante na mata', { lob: 3 }], ['o silêncio de uma biblioteca', { mag: 2, bru: 1 }]] },
  { q: 'Uma aldeia pede ajuda contra algo que mata à noite.', a: [['monto guarda na praça com eles', { pal: 2, gue: 1 }], ['caço a coisa até o covil', { cac: 2, lob: 1 }], ['descubro o que ela é antes de tudo', { mag: 2, tec: 1 }], ['cobro pelo serviço… ou converso com a coisa', { bru: 2, vam: 1 }]] },
  { q: 'Poder, para você, é…', a: [['força no braço', { gue: 2, lob: 1 }], ['conhecimento', { mag: 2, tec: 1 }], ['proteger quem não pode', { pal: 2, cac: 1 }], ['um pacto bem feito', { bru: 2, vam: 1 }]] },
  { q: 'Você encontra um livro proibido.', a: [['queimo', { pal: 2, cac: 1 }], ['leio escondido', { bru: 2, mag: 1 }], ['levo a um mestre que entenda', { mag: 2, tec: 1 }], ['vendo pelo melhor preço', { vam: 2, tec: 1 }]] },
  { q: 'Noite de lua cheia. Você sente…', a: [['vontade de correr pela mata', { lob: 3 }], ['frio, e procura uma fogueira', { gue: 1, pal: 1, tec: 1 }], ['que algo observa você', { cac: 2, bru: 1 }], ['sede', { vam: 3 }]] },
  { q: 'Qual arma você escolheria sem pensar?', a: [['machado e escudo', { gue: 2, pal: 1 }], ['uma besta com virotes de prata', { cac: 2, pal: 1 }], ['uma máquina que eu mesmo montei', { tec: 3 }], ['as próprias mãos', { lob: 2, vam: 1 }]] },
  { q: 'Alguém traiu você.', a: [['enfrento cara a cara', { gue: 2, lob: 1 }], ['perdoo, mas não esqueço', { pal: 2, mag: 1 }], ['espero, e cobro com juros', { vam: 2, bru: 1 }], ['estudo onde errei, para não repetir', { tec: 2, mag: 1 }]] },
  { q: 'Se pudesse viver mil anos, você…', a: [['recusaria: uma vida basta', { pal: 2, gue: 1 }], ['aceitaria, pelo saber', { mag: 2, vam: 1 }], ['aceitaria, a qualquer preço', { vam: 2, bru: 2 }], ['só se fosse para caçar o mal por mil anos', { cac: 2, pal: 1 }]] },
  { q: 'A Deusa dos Caminhos oferece um presente a você.', a: [['uma lâmina que não quebra', { gue: 2, cac: 1 }], ['um olho que vê através das coisas', { mag: 2, bru: 1 }], ['uma engrenagem que move o mundo', { tec: 3 }], ['uma lua só sua', { lob: 2, vam: 1 }]] },
];
interface Ctx { karma(): number; name(): string; onChoose(p: PathDef | null, revealed: PathDef): void }
export function createVidente(ctx: Ctx) {
  const el = document.createElement('div'); el.id = 'vidw'; document.body.appendChild(el);
  let open = false, step = -1, score: Record<PathId, number> = { gue: 0, pal: 0, cac: 0, tec: 0, vam: 0, lob: 0, mag: 0, bru: 0 }, ranked: PathDef[] = [], picked: PathId | null = null;
  const sand = '<div class="vsand"><i></i><i></i><i></i></div>';
  function render() {
    if (!open) { el.style.display = 'none'; return; }
    let body = '';
    if (step === -1) body = `<p class="vq">Sente-se, ${ctx.name()}. A Deusa dos Caminhos não escolhe por ninguém, mas ela vê para onde cada alma inclina.</p><p class="vq">Responda sem pensar demais. Doze perguntas. Depois eu conto o que vi.</p><button class="vbtn" data-vgo>Estou pronto</button>`;
    else if (step < Q.length) { const it = Q[step]; body = `<div class="vprog">${Q.map((_, i) => `<i class="${i < step ? 'd' : i === step ? 'n' : ''}"></i>`).join('')}</div><p class="vq big">${it.q}</p><div class="vans">${it.a.map(([t], i) => `<button data-va="${i}">${t}</button>`).join('')}</div>`; }
    else if (step === Q.length) { const [a, b] = ranked; body = `<p class="vq">O véu se abre. Eu vejo…</p><div class="vrev" style="--c:${a.col}"><b>${a.name}</b><p>${a.line}</p><small>Quem recebe: <b>${a.mentor}</b> · ${a.place}</small></div><div class="vrev two" style="--c:${b.col}"><small>E, mais de longe, também:</small><b>${b.name}</b><p>${b.line}</p></div>
      <p class="vq free">"O que eu vi é o que a sua alma inclina, não uma corrente. Em Karmika, quem escolhe é você."</p><button class="vbtn" data-vfree>Escolher o meu caminho</button>`; }
    else { body = `<p class="vq">Qual caminho você toma?</p><div class="vpaths">${PATHS.map((p) => `<button data-vp="${p.id}" style="--c:${p.col}" class="${picked === p.id ? 'on' : ''} ${ranked[0].id === p.id ? 'top' : ''}"><b>${p.name}</b><small>${p.mentor}</small><small>${p.place}</small></button>`).join('')}</div>
      <button class="vwait ${picked === null ? '' : ''}" data-vwait>Ainda não. Quero seguir humano por enquanto.<small>A vida comum também é um caminho: casa, ofício, terra e gente. Você pode voltar aqui quando quiser.</small></button>
      ${picked ? `<button class="vbtn" data-vok>Seguir para ${PATHS.find((p) => p.id === picked)!.mentor}</button><small class="vwarn">Ao aceitar o mestre, a barra de classe recomeça do zero, sem volta. O que você aprendeu como humano continua com você.</small>` : ''}`; }
    el.innerHTML = `<div class="pn vidpn"><h2>Hrefna, a Vidente dos Caminhos <button data-vx>✕</button></h2>${sand}<div class="vbody">${body}</div><small class="ft">Esc fecha</small></div>`;
    el.style.display = 'flex';
  }
  el.addEventListener('click', (e) => { const t = e.target as HTMLElement; const d = (k: string) => (t.closest(`[data-${k}]`) as HTMLElement | null)?.getAttribute(`data-${k}`);
    if (t.closest('[data-vx]')) { api.close(); return; }
    if (t.closest('[data-vgo]')) { step = 0; render(); return; }
    const va = d('va'); if (va !== null && va !== undefined && step >= 0 && step < Q.length) { for (const [k, v] of Object.entries(Q[step].a[+va][1])) score[k as PathId] += v!; step++;
      if (step === Q.length) { const k = ctx.karma(); if (k > 30) { score.pal += 2; score.cac += 1; } else if (k < -30) { score.bru += 2; score.vam += 1; } ranked = [...PATHS].sort((a, b) => score[b.id] - score[a.id]); }
      render(); return; }
    if (t.closest('[data-vfree]')) { step = Q.length + 1; picked = ranked[0].id; render(); return; }
    const vp = d('vp'); if (vp) { picked = vp as PathId; render(); return; }
    if (t.closest('[data-vok]') && picked) { const p = PATHS.find((x) => x.id === picked)!; api.close(); ctx.onChoose(p, ranked[0]); return; }
    if (t.closest('[data-vwait]')) { api.close(); ctx.onChoose(null, ranked[0]); return; } });
  const api = {
    get isOpen() { return open; },
    open() { open = true; step = -1; picked = null; score = { gue: 0, pal: 0, cac: 0, tec: 0, vam: 0, lob: 0, mag: 0, bru: 0 }; render(); },
    close() { open = false; render(); },
  };
  return api;
}
