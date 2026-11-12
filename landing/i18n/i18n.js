/* 10/11 (Erling: "coloque a landing page em multi-idioma: português, inglês, espanhol e letão").
   A página é escrita em português. Em outro idioma, cada bloco de texto (um parágrafo, um título, um botão, com o negrito e o itálico
   dentro) é trocado inteiro pela tradução do dicionário /i18n/<lang>.json, com a mesma marcação. O que o JavaScript desenha depois
   (painéis, classes, carrosséis) é traduzido no momento em que aparece. Atributos (alt, title, aria-label, placeholder, legenda) também. */
(function () {
  var LANGS = ['pt', 'en', 'es', 'lv'];
  var INLINE = { B: 1, STRONG: 1, I: 1, EM: 1, BR: 1, SMALL: 1, SPAN: 1, A: 1, U: 1, SUP: 1, SUB: 1, MARK: 1, ABBR: 1, S: 1, Q: 1, CITE: 1 };
  var ATTRS = ['alt', 'title', 'aria-label', 'placeholder', 'data-cap'];
  var norm = function (s) { return String(s).replace(/\s+/g, ' ').trim(); };
  /* bloco = tem texto e só marcação de linha dentro; um contêiner só de etiquetas (sem texto próprio) é aberto e cada etiqueta vira um bloco */
  var ownText = function (el) { for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && norm(n.nodeValue)) return true; return false; };
  var isLeaf = function (el) { if (!norm(el.textContent)) return false; if (el.childElementCount > 1 && !ownText(el)) return false;
    for (var c = el.firstElementChild; c; c = c.nextElementSibling) { if (!INLINE[c.tagName] || !isLeaf2(c)) return false; } return true; };
  var isLeaf2 = function (el) { for (var c = el.firstElementChild; c; c = c.nextElementSibling) { if (!INLINE[c.tagName] || !isLeaf2(c)) return false; } return true; };
  var SKIP = { SCRIPT: 1, STYLE: 1, SVG: 1, svg: 1, NOSCRIPT: 1, TEXTAREA: 1, IFRAME: 1, CANVAS: 1 };
  /* percorre a árvore e entrega cada bloco de texto (fn(el, chave)), cada texto solto entre blocos (fn(textNode, chave)) e cada atributo */
  var walk = function (root, onBlock, onText, onAttr) {
    var visit = function (el) {
      if (SKIP[el.tagName] || (el.closest && el.closest('[data-noi18n]'))) return;
      for (var i = 0; i < ATTRS.length; i++) { var v = el.getAttribute && el.getAttribute(ATTRS[i]); if (v && norm(v)) onAttr(el, ATTRS[i], norm(v)); }
      if (el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button') && el.value) onAttr(el, 'value', norm(el.value));
      if (isLeaf(el)) { onBlock(el, norm(el.innerHTML)); var all = el.querySelectorAll('*'); for (var k = 0; k < all.length; k++) for (var j = 0; j < ATTRS.length; j++) { var v2 = all[k].getAttribute(ATTRS[j]); if (v2 && norm(v2)) onAttr(all[k], ATTRS[j], norm(v2)); } return; }
      for (var n = el.firstChild; n; n = n.nextSibling) { if (n.nodeType === 1) visit(n); else if (n.nodeType === 3 && norm(n.nodeValue)) onText(n, norm(n.nodeValue)); }
    };
    if (root.nodeType === 1) visit(root); else if (root.nodeType === 3 && norm(root.nodeValue) && root.parentNode) visit(root.parentNode);
  };
  /* coletor (só para gerar o dicionário): window.__i18nCollect(raiz) devolve todas as chaves */
  window.__i18nCollect = function (root) { var out = {}; walk(root || document.body, function (e, k) { out[k] = 1; }, function (t, k) { out[k] = 1; }, function (e, a, k) { out[k] = 1; }); return Object.keys(out); };

  if (/[?&]collect=1/.test(location.search)) window.__i18nStatic = window.__i18nCollect(document.body);
  var q = /[?&]lang=(\w+)/.exec(location.search), lang = q && q[1];
  try { if (lang && LANGS.indexOf(lang) >= 0) localStorage.setItem('karmika.lang', lang); else lang = localStorage.getItem('karmika.lang'); } catch (e) { /* */ }
  if (!lang || LANGS.indexOf(lang) < 0) { var nl = (navigator.language || 'pt').slice(0, 2).toLowerCase(); lang = nl === 'pt' ? 'pt' : nl === 'es' ? 'es' : nl === 'lv' ? 'lv' : 'en'; }
  window.KARMIKA_LANG = lang; document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
  /* botões de idioma na barra (marca o atual) */
  var mark = function () { var bs = document.querySelectorAll('[data-lang]'); for (var i = 0; i < bs.length; i++) bs[i].classList.toggle('on', bs[i].getAttribute('data-lang') === lang); };
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-lang]'); if (!b) return; e.preventDefault(); var l = b.getAttribute('data-lang');
    try { localStorage.setItem('karmika.lang', l); } catch (er) { /* */ } location.href = location.pathname + (l === 'pt' ? '?lang=pt' : '?lang=' + l) + location.hash; });
  mark();
  if (lang === 'pt') return;
  var D = {}, RE = [];
  try { var x = new XMLHttpRequest(); x.open('GET', '/i18n/' + lang + '.json?v=11', false); x.send(); if (x.status === 200) { var j = JSON.parse(x.responseText); D = j.t || {}; RE = (j.re || []).map(function (r) { return [new RegExp(r[0]), r[1]]; }); } } catch (e) { /* sem dicionário: fica em português */ }
  var tr = function (k) { if (Object.prototype.hasOwnProperty.call(D, k)) return D[k]; for (var i = 0; i < RE.length; i++) if (RE[i][0].test(k)) return k.replace(RE[i][0], RE[i][1]); return null; };
  var done = new WeakSet();
  var apply = function (root) {
    walk(root, function (el, k) { if (done.has(el)) return; var v = tr(k); if (v != null && norm(v) !== k) { done.add(el); el.innerHTML = v; } },
      function (t, k) { var v = tr(k); if (v != null && v !== k) t.nodeValue = t.nodeValue.replace(/\S[\s\S]*\S|\S/, v); },
      function (el, a, k) { var v = tr(k); if (v != null && v !== k) { if (a === 'value') el.value = v; else el.setAttribute(a, v); } });
  };
  var t = tr(norm(document.title)); if (t) document.title = t;
  var metas = document.querySelectorAll('meta[name=description],meta[property="og:title"],meta[property="og:description"]');
  for (var i = 0; i < metas.length; i++) { var mv = tr(norm(metas[i].content)); if (mv) metas[i].content = mv; }
  apply(document.body);
  /* o que o JavaScript desenhar depois */
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) { var m = ms[i];
      if (m.target.nodeType === 1 && m.target.closest('[data-words]')) continue; /* o manifesto vira uma palavra por span depois de traduzido */
      if (m.type === 'childList') { if (m.target.nodeType === 1 && done.has(m.target)) done.delete(m.target);
        if (m.addedNodes.length && m.target.nodeType === 1 && isLeaf(m.target)) apply(m.target); else for (var j = 0; j < m.addedNodes.length; j++) apply(m.addedNodes[j]); }
      else if (m.type === 'attributes' && ATTRS.indexOf(m.attributeName) >= 0) { var v = m.target.getAttribute(m.attributeName), tv = v && tr(norm(v)); if (tv && tv !== v) m.target.setAttribute(m.attributeName, tv); }
      else if (m.type === 'characterData') apply(m.target); }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
})();
