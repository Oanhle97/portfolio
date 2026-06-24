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

  function run(root) {
    (root || document).querySelectorAll(SELECTORS).forEach(function (el) {
      if (el.dataset.widowFixed) resetWidowFix(el);
      fixWidowsIn(el);
    });
  }

  function initArchive(root) {
    (root || document).querySelectorAll('[data-archive]').forEach(function (section) {
      var btn = section.querySelector('.cs-archive-toggle');
      if (!btn || btn.dataset.bound) return;
      btn.dataset.bound = '1';
      section.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    });
  }

  window.initCaseStudyContent = function (root) {
    initArchive(root);
    run(root);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { run(); initArchive(); });
  } else {
    run();
    initArchive();
  }

  window.addEventListener('resize', debounce(function () { run(); }, 250));
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { run(); });
  }
})();
