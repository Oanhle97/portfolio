(function () {
  var STATE_KEY = 'portfolio-home-state';

  function saveHomeState() {
    var openCases = [];
    document.querySelectorAll('#stack .tape').forEach(function (tape) {
      if (!tape.classList.contains('is-open')) return;
      var url = tape.getAttribute('data-case');
      if (url) openCases.push(url);
    });
    sessionStorage.setItem(
      STATE_KEY,
      JSON.stringify({
        scrollY: window.scrollY,
        openCases: openCases,
        mobile: mobileMq.matches,
      })
    );
  }

  function revealHome() {
    document.documentElement.classList.remove('home-restoring', 'home-no-transitions');
  }

  function restoreHomeState() {
    var raw = sessionStorage.getItem(STATE_KEY);
    if (!raw) return;
    sessionStorage.removeItem(STATE_KEY);

    document.documentElement.classList.add('home-no-transitions');

    var state;
    try {
      state = JSON.parse(raw);
    } catch (e) {
      revealHome();
      return;
    }

    if (!mobileMq.matches && state.openCases && state.openCases.length) {
      document.querySelectorAll('#stack .tape').forEach(function (tape) {
        var url = tape.getAttribute('data-case');
        tape.classList.toggle('is-open', state.openCases.indexOf(url) !== -1);
      });
      syncExpandAllBtn();
    }

    if (typeof state.scrollY === 'number') {
      window.scrollTo({left: 0, top: state.scrollY, behavior: 'instant'});
    }

    requestAnimationFrame(revealHome);
  }

  function goCase(url) {
    saveHomeState();
    window.location.href = url;
  }

  function expandTape(tape) {
    if (mobileMq.matches) {
      syncMobileTapes();
      return;
    }
    if (tape) tape.classList.add('is-open');
    syncExpandAllBtn();
  }

  var expandAllBtn = document.getElementById('expandAll');

  function syncExpandAllBtn() {
    if (!expandAllBtn || mobileMq.matches) return;
    var tapes = document.querySelectorAll('#stack .tape');
    var allOpen =
      tapes.length &&
      Array.prototype.every.call(tapes, function (t) {
        return t.classList.contains('is-open');
      });
    var txt = expandAllBtn.querySelector('.expand-all-txt');
    if (txt) txt.textContent = allOpen ? 'Collapse all' : 'Expand all';
    expandAllBtn.classList.toggle('is-all-open', allOpen);
  }

  var mobileMq = window.matchMedia('(max-width:820px)');

  restoreHomeState();

  if (expandAllBtn) {
    expandAllBtn.addEventListener('click', function () {
      if (mobileMq.matches) return;
      var tapes = document.querySelectorAll('#stack .tape');
      var allOpen = Array.prototype.every.call(tapes, function (t) {
        return t.classList.contains('is-open');
      });
      tapes.forEach(function (t) {
        t.classList.toggle('is-open', !allOpen);
      });
      syncExpandAllBtn();
    });
    syncExpandAllBtn();
  }

  document.querySelectorAll('#stack .tape').forEach(function (tape) {
    var url = tape.getAttribute('data-case');
    if (!url) return;
    tape.addEventListener('click', function (e) {
      if (e.target.closest('a[href]')) return;
      if (mobileMq.matches) {
        e.preventDefault();
        goCase(url);
        return;
      }
      if (e.target.closest('.cap-r')) {
        return;
      }
      if (e.target.closest('.slotwrap') || e.target.closest('.d-block')) {
        e.preventDefault();
        goCase(url);
        return;
      }
      if (e.target.closest('.spine')) {
        e.preventDefault();
        tape.classList.toggle('is-open');
        syncExpandAllBtn();
      }
    });
  });

  document.querySelectorAll('a[href*="case-"]').forEach(function (link) {
    link.addEventListener('click', saveHomeState);
  });

  setTimeout(revealHome, 500);

  document.querySelectorAll('.jump-stupid').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var tape = document.getElementById('work-stupid');
      if (!tape) return;
      expandTape(tape);
      requestAnimationFrame(function () {
        tape.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  });
})();
