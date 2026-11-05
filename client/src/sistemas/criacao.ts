/* TELA DE CRIAÇÃO DE PERSONAGEM e RENASCIMENTO: origem, sexo, nome, retrato girando; nascer de novo depois da morte. Saiu do main.ts (02/11). */
import { setMyFac } from '../faccoes';
import { CATCHUP_MUL } from '../soul';
import { confirmBox } from '../windows';
import { kkEye } from './talentos-ui';
import type { CriacaoCtx, Profile } from '../main';

export function createCriacao(K: CriacaoCtx) {
/* ---- tela de criação de personagem ---- */
let createAC: AbortController | null = null;
/** reencarnar: a alma (nome, karma, nível, mochila, ouro, cofre, missões) entra num corpo novo, sem classe */
function rebirth(name: string, np: Profile) {
  const past = K.soul.s.lives[K.soul.s.lives.length - 1];
  K.profile = np; localStorage.setItem('karmika.char.v1', JSON.stringify(K.profile)); // sem path: Hrefna lê o caminho de novo
  K.state.race = K.raceOf(np.origin); K.game.resetClass(K.classOfRace(K.state.race)); K.game.setClassName(K.classOfRace(K.state.race));
  setMyFac(null); K.quests.forget((id) => id.startsWith('v_'));
  K.tree.wipe(); const pts = K.inv.respec(); K.swapHero(); K.updateWho(); K.checkSkinLevel();
  K.soul.s.pending = null; K.soul.save();
  const s0 = K.city.starts[np.origin];
  const msg = `✦ ${name} renasce ${np.origin === 'dwarf' ? 'anão' : np.origin === 'elf' ? 'elfo' : 'humano'}, em ${s0.name}. A alma lembra; o corpo é novo.`;
  if (K.limiar.active) K.limiar.descend(() => K.placeAt(msg, { x: s0.x, y: s0.y }), true); else K.goHome(msg, { x: s0.x, y: s0.y });
  setTimeout(() => {
    K.game.logMsg(`⚖ Nível ${K.game.st.lvl}, mochila, ouro e missões vieram com você. A classe recomeçou: fale com Hrefna, em Askavik, para ler o caminho de novo.`, '#ffe08a');
    if (past) K.game.logMsg(`✦ Eco da vida passada: se seguir ${past.cls} de novo, a classe ganha ${CATCHUP_MUL}× XP até o nível ${K.soul.s.catchup?.until ?? past.clsLvl}.`, '#c9a0ff');
    if (pts) K.game.logMsg(`★ ${pts} pontos de atributo voltaram para distribuir (I).`, '#ffe08a');
    K.netRef?.lookNow(); K.saveSlotMeta();
  }, 900);
}
/** reborn = reencarnação: mesma alma (nome), corpo novo; nível, mochila, ouro, cofre e missões ficam */
function showCreate(reborn = false) {
  const el = document.getElementById('create')!; el.style.display = 'grid'; K.peleSys.creating = true; K.keys.clear();
  createAC?.abort(); createAC = new AbortController(); const sig = createAC.signal; const soulName = reborn ? K.profile?.name ?? '' : '', oldProfile = reborn ? K.profile : null;
  el.classList.toggle('reborn', reborn); (el.querySelector('h2') as HTMLElement).textContent = reborn ? 'Reencarnação' : 'Criação de personagem';
  (el.querySelector('#c-go') as HTMLElement).textContent = reborn ? 'RENASCER EM KARMIKA' : 'ENTRAR EM KARMIKA';
  { const hint = el.querySelector('.hint') as HTMLElement; hint.dataset.orig ??= hint.innerHTML; hint.innerHTML = reborn ? `A alma de <b>${soulName}</b> escolhe um corpo novo. Você mantém o nível ${K.game.st.lvl}, a mochila, o ouro, o cofre e as missões, e volta sem classe: refaça o caminho com Hrefna. Se escolher ${K.soul.s.catchup?.cls ?? K.game.classInfo.name} de novo, a classe ganha ${CATCHUP_MUL}× XP até o nível ${K.soul.s.catchup?.until ?? K.game.classInfo.lvl}.` : hint.dataset.orig; }
  { const nm = el.querySelector('#c-name') as HTMLInputElement; nm.value = soulName; (el.querySelector('#c-err') as HTMLElement).textContent = ''; }
  const hairEl = el.querySelector('#c-hair')!, skinEl = el.querySelector('#c-skin')!, styleEl = el.querySelector('#c-style')!, beardEl = el.querySelector('#c-beard')!, pv = el.querySelector('#c-pv') as HTMLImageElement;
  hairEl.innerHTML = K.HAIRS.map((h, i) => `<i data-h="${i}" class="${i === 0 ? 'on' : ''}" style="background:#${h.toString(16).padStart(6, '0')}"></i>`).join('');
  skinEl.innerHTML = K.SKINS.map((h, i) => `<i data-s="${i}" class="${i === 0 ? 'on' : ''}" style="background:#${h.toString(16).padStart(6, '0')}"></i>`).join('');
  const STYLES: [Profile['hairStyle'], string][] = [['braid', 'Trança'], ['long', 'Comprido'], ['short', 'Curto'], ['bald', 'Raspado']];
  styleEl.innerHTML = STYLES.map(([k, n], i) => `<button data-st="${k}" class="${i === 0 ? 'on' : ''}">${n}</button>`).join('');
  beardEl.innerHTML = [['0', 'Sem barba'], ['1', 'Curta'], ['2', 'Longa']].map(([k, n], i) => `<button data-bd="${k}" class="${i === 0 ? 'on' : ''}">${n}</button>`).join('');
  let hair = 0, skin = 0, origin: Profile['origin'] = 'human', hairStyle: Profile['hairStyle'] = 'braid', beard = 0, sex: 'f' | 'm' = 'f';
  el.querySelectorAll('[data-o]').forEach((x) => x.classList.toggle('on', (x as HTMLElement).dataset.o === 'human')); el.querySelectorAll('[data-sx]').forEach((x) => x.classList.toggle('on', (x as HTMLElement).dataset.sx === 'f'));
  el.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const h = t.closest('[data-h]') as HTMLElement | null; if (h) { hair = +h.dataset.h!; hairEl.querySelectorAll('i').forEach((x) => x.classList.toggle('on', x === h)); preview(); }
    const sk = t.closest('[data-s]') as HTMLElement | null; if (sk) { skin = +sk.dataset.s!; skinEl.querySelectorAll('i').forEach((x) => x.classList.toggle('on', x === sk)); preview(); }
    const o = t.closest('[data-o]') as HTMLElement | null; if (o) { origin = o.dataset.o as Profile['origin']; el.querySelectorAll('[data-o]').forEach((x) => x.classList.toggle('on', x === o)); preview(); }
    const st = t.closest('[data-st]') as HTMLElement | null; if (st) { hairStyle = st.dataset.st as Profile['hairStyle']; styleEl.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === st)); preview(); }
    const sx = t.closest('[data-sx]') as HTMLElement | null; if (sx) { sex = sx.dataset.sx as 'f' | 'm'; el.querySelectorAll('[data-sx]').forEach((x) => x.classList.toggle('on', x === sx)); preview(); }
    const bd = t.closest('[data-bd]') as HTMLElement | null; if (bd) { beard = +bd.dataset.bd!; beardEl.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === bd)); preview(); }
    if (t.closest('#c-back')) { el.style.display = 'none'; K.peleSys.creating = false; K.hero.gearVisible(true); K.inicio.openChars(K.pendingServer); return; }
    if (t.closest('#c-go')) {
      const name = ((el.querySelector('#c-name') as HTMLInputElement).value || '').trim(); if (name.length < 2) { (el.querySelector('#c-err') as HTMLElement).textContent = 'Escolha um nome com pelo menos 2 letras.'; return; }
      if (reborn) { rebirth(name, { name, origin, sex, hair: K.HAIRS[hair], skin: K.SKINS[skin], title: oldProfile?.title ?? '', hairStyle, beard, eye: oldProfile?.eye }); el.style.display = 'none'; K.peleSys.creating = false; return; }
      /* 26/10 (Erling: "a tela fica escura antes de entrar no jogo — faça a tela de loading"): o mundo carrega por trás do Olho */
      K.withFade(() => {
      /* 27/10 (Erling): nasce-se neutro. Luz e sombra são posições, não bem e mal. Só o elfo nasce um pouco pendendo à luz (+35) */
      K.soul.reset(); K.state.karma = origin === 'elf' ? 35 : 0; K.soul.s.karma = K.state.karma; K.soul.s.luzT = 0; K.soul.s.sombraT = 0; K.soul.save();
      K.game.resetClass(K.classOfRace(K.raceOf(origin)));
      try { localStorage.removeItem('karmika.welcome'); localStorage.removeItem('karmika.startkit'); localStorage.removeItem('karmika.startkit.v2'); } catch { /* */ } // personagem novo: o Baú de Boas-Vindas espera de novo
      K.profile = { name, origin, sex, hair: K.HAIRS[hair], skin: K.SKINS[skin], title: '', hairStyle, beard }; localStorage.setItem('karmika.char.v1', JSON.stringify(K.profile));
      K.inv.reset(); K.quests.reset(); K.state.race = K.raceOf(origin); K.swapHero(); K.updateWho(); { const s0 = K.city.starts[origin]; K.state.fx = s0.x; K.state.fy = s0.y; localStorage.removeItem(K.HOME_KEY); K.larSys.home = K.defaultHome(); if (origin !== 'human') K.game.logMsg(origin === 'dwarf' ? '⛏ Você nasce em Brasaforja, no sopé da Montanha Negra. As estradas levam a Askavik, onde as academias esperam.' : '🌿 Você nasce em Lithendel, sob as árvores mais velhas do mundo. As estradas levam a Askavik, onde as academias esperam.', '#ffe08a'); } K.setCombat(false, true);
      el.style.display = 'none'; K.peleSys.creating = false; K.checkSkinLevel(); setTimeout(() => { K.joinServer(); K.saveSlotMeta(); }, 600); setTimeout(() => K.inicio.takeBackHome(), 900); /* criou pelo menu: volta para a tela principal escolher onde jogar */ K.game.logMsg(`Bem-vindo a Karmika, ${name}. Fale com Garrick (E) para começar.`, '#ffe08a');
      K.mail.welcome(name); K.game.logMsg('📮 Três cartas esperam por você na caixa de correio.', '#ffe08a'); K.giveStartKit();
      }, `Preparando o mundo de ${name}…`);
    }
  }, { signal: sig });
  /* 05/11 (Erling: "quando troco de homem para mulher aparece por poucos segundos o personagem quadrado de antes… coloque um loading karmiko"):
     enquanto o modelo novo carrega, o retrato some e o Olho Kármico pulsa no lugar; o boneco de blocos nunca aparece na tela de criação */
  let pvT = 0, loading = false, loadT = 0;
  const cpv = pv.parentElement as HTMLElement;
  if (!cpv.querySelector('.cpload')) cpv.insertAdjacentHTML('afterbegin', `<div class="cpload"><svg viewBox="0 0 120 90">${kkEye(60, 45, 34)}</svg><span>moldando o corpo…</span></div>`);
  const setLoading = (on: boolean) => { loading = on; cpv.classList.toggle('loading', on); clearTimeout(loadT); if (on) loadT = window.setTimeout(() => { if (loading) shot(true); }, 7000); };
  const shot = (done = false) => { try { K.portraits.delete('hero'); const src = K.portraitOf('hero', K.hero.root, true); if (src) pv.src = src; } catch { /* */ } if (done) setLoading(false); };
  { /* 02/11: o retrato gira devagar enquanto a tela de criação está aberta */ const spin = setInterval(() => { if (el.style.display === 'none' || sig.aborted) { clearInterval(spin); return; } K.portraitYaw += 0.045; if (loading) return; try { K.portraits.delete('hero'); const src = K.portraitOf('hero', K.hero.root, true); if (src) pv.src = src; } catch { /* */ } }, 90); sig.addEventListener('abort', () => { clearInterval(spin); K.hero.gearVisible(true); }); }
  addEventListener('karmika:skinready', () => { if (el.style.display === 'none') return; for (const ms of [120, 600, 1500]) setTimeout(() => { if (ms === 120) { shot(true); return; } try { K.portraits.delete('hero'); const src = K.portraitOf('hero', K.hero.root, true); if (src) pv.src = src; } catch { /* */ } }, ms); }, { signal: sig }); /* a textura do modelo chega um pouco depois: tira o retrato de novo */
  function preview() {
    K.state.race = K.raceOf(origin); K.profile = { name: '', origin, sex, hair: K.HAIRS[hair], skin: K.SKINS[skin], title: '', hairStyle, beard }; K.swapHero(); K.profile = null;
    /* 02/11 (Erling): as telas das três origens iguais à do humano — cabelo, pele, penteado e barba ainda não existem nos modelos do Herik; o corpo (mulher/homem) vale para todos */
    for (const id of ['c-hair', 'c-skin', 'c-style', 'c-beard']) { const n = el.querySelector('#' + id) as HTMLElement | null; if (n) { n.style.display = 'none'; (n.previousElementSibling as HTMLElement).style.display = 'none'; } }
    (el.querySelector('#c-sex') as HTMLElement).style.display = ''; ((el.querySelector('#c-sex') as HTMLElement).previousElementSibling as HTMLElement).style.display = '';
    K.hero.gearVisible(false); K.portraitYaw = 0.42;
    (el.querySelector('#c-note') as HTMLElement).textContent = origin === 'dwarf' ? 'Anões carregam a barba da forja: penteado e barba vêm da raça.' : origin === 'elf' ? 'Elfos: orelhas pontudas e passo leve. Por ora trilham o Caminho do Norte; a Academia abre depois.' : '';
    setLoading(true); clearTimeout(pvT);
  }
  preview();
}
document.getElementById('m-new')?.addEventListener('click', () => { confirmBox('Criar um novo personagem do zero apaga o atual: nível, mochila, magias, missões, relíquias e lar. Continuar?', 'Apagar e criar novo', () => { for (const k of Object.keys(localStorage)) if (k.startsWith('karmika.') && !k.startsWith('karmika.ui.') && k !== 'karmika.pix' && k !== 'karmika.shadows' && k !== 'karmika.music' && k !== 'karmika.rows') localStorage.removeItem(k); location.reload(); }); });
  return { showCreate };
}
