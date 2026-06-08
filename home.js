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
    if (mobileMq.matches) return;
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

  function expandAllTapes() {
    if (mobileMq.matches) return;
    document.querySelectorAll('#stack .tape').forEach(function (t) {
      t.classList.add('is-open');
    });
    syncExpandAllBtn();
  }

  var mobileMq = window.matchMedia('(max-width:820px)');

  var panelWork = document.getElementById('panel-work');
  var panelAbout = document.getElementById('panel-about');
  var PAGE_TITLE = 'Oanh Le, Product Designer';
  var ABOUT_TITLE = 'About — Oanh Le';
  var workScrollY = 0;

  function scrollInstant(y) {
    window.scrollTo({ left: 0, top: y, behavior: 'instant' });
  }

  function showPanel(panel, activeTab) {
    var isAbout = panel === 'about';
    var wasAbout = panelAbout && !panelAbout.hidden;

    if (isAbout && panelWork && !panelWork.hidden) {
      workScrollY = window.scrollY;
    }

    if (panelWork) panelWork.hidden = isAbout;
    if (panelAbout) panelAbout.hidden = !isAbout;
    document.querySelectorAll('.nav-tab').forEach(function (link) {
      link.classList.toggle('is-active', !!activeTab && link.getAttribute('data-panel') === activeTab);
    });
    document.title = isAbout ? ABOUT_TITLE : PAGE_TITLE;

    if (isAbout) {
      scrollInstant(0);
    } else if (wasAbout) {
      scrollInstant(workScrollY);
    }
  }

  function stateFromHash() {
    var hash = location.hash;
    if (hash === '#about') return { panel: 'about', active: 'about' };
    if (hash === '#work') return { panel: 'work', active: 'work' };
    return { panel: 'work', active: null };
  }

  function applyPanelFromHash() {
    var state = stateFromHash();
    showPanel(state.panel, state.active);
    if (state.active === 'work') expandAllTapes();
    var hash = location.hash;
    if (hash && hash !== '#about' && hash !== '#top' && hash !== '#work') {
      var target = document.querySelector(hash);
      if (target) target.scrollIntoView();
    }
  }

  document.querySelectorAll('.nav-tab').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var panel = link.getAttribute('data-panel');
      if (!panel) return;
      e.preventDefault();
      var hash = panel === 'about' ? '#about' : '#work';
      if (location.hash !== hash) history.pushState(null, '', hash);
      showPanel(panel, panel);
      if (panel === 'work') {
        expandAllTapes();
        var work = document.getElementById('work');
        if (work) work.scrollIntoView();
      }
    });
  });

  var brand = document.querySelector('.brand');
  if (brand) {
    brand.addEventListener('click', function (e) {
      e.preventDefault();
      if (location.hash) history.pushState(null, '', '#top');
      showPanel('work', null);
      scrollInstant(0);
    });
  }

  window.addEventListener('hashchange', applyPanelFromHash);

  restoreHomeState();
  applyPanelFromHash();

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
      if (panelAbout && !panelAbout.hidden) showPanel('work', null);
      expandTape(tape);
      if (location.hash !== '#work-stupid') history.pushState(null, '', '#work-stupid');
      requestAnimationFrame(function () {
        tape.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  });
})();
