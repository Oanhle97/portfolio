(function () {
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(ta);
    }
    return Promise.resolve();
  }

  function showCopiedTip(el) {
    var tip = el.querySelector('.copy-tip');
    if (!tip) {
      tip = document.createElement('span');
      tip.className = 'copy-tip';
      tip.textContent = 'Copied';
      tip.setAttribute('role', 'status');
      el.appendChild(tip);
    }
    clearTimeout(el._copyTipTimer);
    tip.classList.add('show');
    el._copyTipTimer = setTimeout(function () {
      tip.classList.remove('show');
    }, 2000);
  }

  function initCopy() {
    document.querySelectorAll('[data-copy]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var text = el.getAttribute('data-copy');
        if (!text) return;
        copyText(text).then(function () {
          showCopiedTip(el);
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCopy);
  } else {
    initCopy();
  }
})();
