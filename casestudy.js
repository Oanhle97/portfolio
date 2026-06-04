(function () {
  var SELECTORS =
    '.cs-sub, .sec p, .sec ul li, .ab-grid p, .ab-right li, .ab-quote';

  function debounce(fn, ms) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  function getWordRects(el, skipSelector) {
    var range = document.createRange();
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var words = [];
    var node;

    while ((node = walker.nextNode())) {
      if (skipSelector && node.parentElement && node.parentElement.closest(skipSelector)) {
        continue;
      }
      var text = node.textContent;
      var i = 0;
      while (i < text.length) {
        while (i < text.length && /\s/.test(text[i])) i++;
        if (i >= text.length) break;
        var start = i;
        while (i < text.length && !/\s/.test(text[i])) i++;
        range.setStart(node, start);
        range.setEnd(node, i);
        var rect = range.getBoundingClientRect();
        if (rect.width > 0) {
          words.push({ node: node, start: start, end: i, top: rect.top });
        }
      }
    }
    return words;
  }

  function joinLastTwoWords(prev, last) {
    var range = document.createRange();
    range.setStart(prev.node, prev.end);
    range.setEnd(last.node, last.start);
    if (!range.collapsed) {
      range.deleteContents();
      range.insertNode(document.createTextNode('\u00a0'));
      return;
    }
    var t = prev.node.textContent;
    var trimmed = t.slice(0, prev.end).replace(/\s+$/, '');
    var tail = t.slice(prev.end);
    if (prev.node === last.node) {
      prev.node.textContent = trimmed + '\u00a0' + tail.replace(/^\s+/, '');
    } else {
      prev.node.textContent = trimmed + '\u00a0';
      last.node.textContent = last.node.textContent.slice(last.start).replace(/^\s+/, '');
    }
  }

  function hasSingleWordLastLine(words) {
    if (words.length < 2) return false;
    var lastTop = words[words.length - 1].top;
    var onLast = 0;
    for (var i = 0; i < words.length; i++) {
      if (Math.abs(words[i].top - lastTop) < 2) onLast++;
    }
    return onLast === 1;
  }

  function resetWidowFix(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      node.textContent = node.textContent.replace(/\u00a0/g, ' ');
    }
    delete el.dataset.widowFixed;
  }

  function fixWidowsIn(el) {
    var skip = el.classList.contains('ab-quote') ? '.by' : null;
    var attempts = 0;
    while (attempts < 4) {
      var words = getWordRects(el, skip);
      if (!hasSingleWordLastLine(words)) break;
      joinLastTwoWords(words[words.length - 2], words[words.length - 1]);
      attempts++;
    }
    el.dataset.widowFixed = '1';
  }

  function run() {
    document.querySelectorAll(SELECTORS).forEach(function (el) {
      if (el.dataset.widowFixed) resetWidowFix(el);
      fixWidowsIn(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  window.addEventListener('resize', debounce(run, 250));
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(run);
  }
})();

(function () {
  var mobileMq = window.matchMedia('(max-width:760px)');

  function initArchiveModal(openBtn) {
    var modalId = openBtn.getAttribute('data-archive-modal');
    if (!modalId) return;
    var modal = document.getElementById(modalId);
    if (!modal) return;

    function openModal() {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('cs-archive-open');
    }

    function closeModal() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('cs-archive-open');
    }

    openBtn.addEventListener('click', function (e) {
      if (!mobileMq.matches) return;
      e.preventDefault();
      openModal();
    });

    modal.querySelectorAll('[data-archive-close]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });
  }

  function initArchiveModals() {
    document.querySelectorAll('[data-archive-open]').forEach(initArchiveModal);
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('.cs-archive-modal.open').forEach(function (modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('cs-archive-open');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArchiveModals);
  } else {
    initArchiveModals();
  }
})();
