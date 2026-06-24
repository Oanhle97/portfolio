(function () {
  var STATE_KEY = 'portfolio-home-state';
  var CASE_FILES = [
    'case-twentyfold.html',
    'case-diginex.html',
    'case-validus.html',
    'case-stupid.html',
  ];

  var leftScrollEl = document.getElementById('leftScroll');
  var rightScrollEl = document.getElementById('rightScroll');
  var leftCloseBtns = document.querySelectorAll('.left-close');
  var deskCloseBtns = document.querySelectorAll('.desk-close');
  var homeLeftEl = document.querySelector('.home-left');
  var panelWork = document.getElementById('panel-work');
  var panelCase = document.getElementById('panel-case');
  var caseMainEl = panelCase ? panelCase.querySelector('.home-cs') : null;
  var mobileMq = window.matchMedia('(max-width:820px)');
  var desktopMq = window.matchMedia('(min-width:821px)');

  var currentCaseUrl = null;
  var workScrollYBeforeCase = 0;
  var activeDeskTab = null;

  function setDesktopScrollMode() {
    document.documentElement.classList.toggle('home-desktop', desktopMq.matches);
  }

  setDesktopScrollMode();
  desktopMq.addEventListener('change', setDesktopScrollMode);

  function caseHash(url) {
    return '#' + url.replace('.html', '');
  }

  function urlFromHash(hash) {
    if (!hash || hash.indexOf('#case-') !== 0) return null;
    return hash.slice(1) + '.html';
  }

  function saveHomeState() {
    var openCases = [];
    document.querySelectorAll('#stack .tape').forEach(function (tape) {
      if (!tape.classList.contains('is-open')) return;
      var url = tape.getAttribute('data-case');
      if (url) openCases.push(url);
    });
    var leftPanel = 'intro';
    ['intro', 'about', 'side'].forEach(function (p) {
      var el = document.getElementById('panel-left-' + p);
      if (el && !el.hidden) leftPanel = p;
    });
    sessionStorage.setItem(
      STATE_KEY,
      JSON.stringify({
        leftScrollY: leftScrollEl ? leftScrollEl.scrollTop : 0,
        rightScrollY: rightScrollEl ? rightScrollEl.scrollTop : 0,
        workScrollY: workScrollYBeforeCase,
        openCases: openCases,
        leftPanel: leftPanel,
        rightCase: currentCaseUrl,
        mobile: mobileMq.matches,
      })
    );
  }

  function revealHome() {
    document.documentElement.classList.remove('home-restoring', 'home-no-transitions');
  }

  function restorePageTitle() {
    var aboutEl = document.getElementById('panel-left-about');
    document.title =
      aboutEl && !aboutEl.hidden ? ABOUT_TITLE : PAGE_TITLE;
  }

  function showWorkPanel(opts) {
    opts = opts || {};
    if (panelWork) panelWork.hidden = false;
    if (panelCase) panelCase.hidden = true;
    currentCaseUrl = null;
    if (caseMainEl) caseMainEl.innerHTML = '';
    if (rightScrollEl) {
      if (typeof opts.scrollY === 'number') rightScrollEl.scrollTop = opts.scrollY;
      else if (opts.scrollTop !== false) rightScrollEl.scrollTop = 0;
    }
    restorePageTitle();
  }

  function wireCaseNav(container, currentUrl) {
    var closeBtn = container.querySelector('.cs-nav-close');
    if (closeBtn) {
      closeBtn.setAttribute('href', '#work');
      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (mobileMq.matches) {
          showWorkPanel({ scrollY: workScrollYBeforeCase });
          if (location.hash !== '#work') history.pushState(null, '', '#work');
          return;
        }
        showWorkPanel({ scrollY: workScrollYBeforeCase });
        if (location.hash !== '#work') history.pushState(null, '', '#work');
      });
    }
    var next = container.querySelector('.cs-nav-next');
    if (next) {
      var idx = CASE_FILES.indexOf(currentUrl);
      var nextUrl = CASE_FILES[(idx + 1) % CASE_FILES.length];
      next.setAttribute('href', '#');
      next.addEventListener('click', function (e) {
        e.preventDefault();
        loadCaseInRight(nextUrl, true);
      });
    }
  }

  function loadCaseInRight(url, updateHistory) {
    if (mobileMq.matches) {
      window.location.href = url;
      return;
    }
    if (!caseMainEl || !panelCase) return;

    if (panelWork && !panelWork.hidden && rightScrollEl) {
      workScrollYBeforeCase = rightScrollEl.scrollTop;
    }

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load case study');
        return res.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var main = doc.querySelector('main.cs');
        if (!main) return;

        caseMainEl.innerHTML = main.innerHTML;
        if (panelWork) panelWork.hidden = true;
        panelCase.hidden = false;
        currentCaseUrl = url;

        wireCaseNav(panelCase, url);
        if (window.initCaseStudyContent) window.initCaseStudyContent(panelCase);
        if (rightScrollEl) rightScrollEl.scrollTop = 0;

        var title = doc.querySelector('title');
        if (title) document.title = title.textContent;

        if (updateHistory) {
          var hash = caseHash(url);
          if (location.hash !== hash) history.pushState({ case: url }, '', hash);
        }
      })
      .catch(function () {
        window.location.href = url;
      });
  }

  function goCase(url, e) {
    if (e) e.preventDefault();
    loadCaseInRight(url, true);
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

    if (mobileMq.matches) {
      if (state.leftPanel) showLeftPanel(state.leftPanel, false);
    } else if (state.rightCase) {
      /* loadCaseInRight handled below */
    } else if (state.leftPanel === 'about') {
      activateLeftTab('about', { skipHash: true, resetScroll: false });
    } else if (state.leftPanel === 'side') {
      activateLeftTab('side', { skipHash: true, resetScroll: false });
    } else if (state.openCases && state.openCases.length) {
      expandAllTapes();
    } else {
      setDesktopHomeDefault({ skipHash: true, resetScroll: false });
    }

    if (typeof state.workScrollY === 'number') {
      workScrollYBeforeCase = state.workScrollY;
    }

    if (leftScrollEl && typeof state.leftScrollY === 'number') {
      leftScrollEl.scrollTop = state.leftScrollY;
    }

    if (state.rightCase && !mobileMq.matches) {
      loadCaseInRight(state.rightCase, false);
      if (rightScrollEl && typeof state.rightScrollY === 'number') {
        requestAnimationFrame(function () {
          rightScrollEl.scrollTop = state.rightScrollY;
        });
      }
    } else if (rightScrollEl && typeof state.rightScrollY === 'number') {
      rightScrollEl.scrollTop = state.rightScrollY;
    }

    requestAnimationFrame(revealHome);
  }

  function expandAllTapes() {
    if (mobileMq.matches) return;
    document.querySelectorAll('#stack .tape').forEach(function (t) {
      t.classList.add('is-open');
    });
    syncWorkTitleState();
  }

  var deskWorkTitle = document.getElementById('deskWorkTitle');

  function syncWorkTitleState() {
    if (!deskWorkTitle || mobileMq.matches) return;
    var tapes = document.querySelectorAll('#stack .tape');
    var allOpen =
      tapes.length &&
      Array.prototype.every.call(tapes, function (t) {
        return t.classList.contains('is-open');
      });
    deskWorkTitle.classList.toggle('is-expanded', allOpen);
    deskWorkTitle.setAttribute('aria-expanded', allOpen ? 'true' : 'false');
  }

  function syncDesktopTabs(tab) {
    activeDeskTab = tab;
    document.querySelectorAll('.desk-tab').forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('data-desk-tab') === tab);
    });
    document.querySelectorAll('.desk-tab-wrap').forEach(function (wrap) {
      var link = wrap.querySelector('.desk-tab');
      var tabId = link ? link.getAttribute('data-desk-tab') : null;
      wrap.classList.toggle(
        'is-active-wrap',
        tabId === tab && (tab === 'about' || tab === 'side')
      );
    });
    deskCloseBtns.forEach(function (btn) {
      btn.hidden = btn.getAttribute('data-desk-close') !== tab;
    });
  }

  function activateLeftTab(tab, opts) {
    opts = opts || {};
    if (mobileMq.matches || (tab !== 'about' && tab !== 'side')) return;
    syncDesktopTabs(tab);
    showLeftPanel(tab, opts.resetScroll !== false);
    if (!opts.skipHash) {
      var hash = tab === 'side' ? '#side' : '#about';
      if (location.hash !== hash) history.pushState(null, '', hash);
    }
  }

  function onDeskWorkTitleClick() {
    if (mobileMq.matches) return;
    if (currentCaseUrl) {
      showWorkPanel({ scrollY: workScrollYBeforeCase, scrollTop: false });
    }
    var tapes = document.querySelectorAll('#stack .tape');
    var allOpen =
      tapes.length &&
      Array.prototype.every.call(tapes, function (t) {
        return t.classList.contains('is-open');
      });
    tapes.forEach(function (t) {
      t.classList.toggle('is-open', !allOpen);
    });
    syncWorkTitleState();
  }

  function setDesktopHomeDefault(opts) {
    opts = opts || {};
    if (mobileMq.matches) return;
    showLeftPanel('intro', opts.resetScroll !== false);
    syncDesktopTabs(null);
    if (!opts.skipHash && location.hash && location.hash !== '#top') {
      history.pushState(null, '', '#top');
    }
  }

  var PAGE_TITLE = 'Oanh Le, Product Designer';
  var ABOUT_TITLE = 'About — Oanh Le';

  function syncLeftNav(leftPanel) {
    if (!mobileMq.matches) return;
    document.querySelectorAll('.left-tab').forEach(function (link) {
      var id = link.getAttribute('data-left');
      link.classList.toggle('is-active', id === leftPanel);
    });
  }

  function syncMobileTapes() {
    document.querySelectorAll('#stack .tape').forEach(function (tape) {
      if (mobileMq.matches) tape.classList.add('is-open');
    });
  }

  function syncMobileNav(leftPanel) {
    document.querySelectorAll('.nav-tab').forEach(function (link) {
      var panel = link.getAttribute('data-panel');
      var active = panel === 'about' ? leftPanel === 'about' : leftPanel === 'intro';
      link.classList.toggle('is-active', active);
    });
  }

  function scrollMobilePanel(id) {
    if (!mobileMq.matches) return;
    requestAnimationFrame(function () {
      if (id === 'about') {
        var about = document.getElementById('panel-left-about');
        if (about) {
          about.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      if (id === 'intro') {
        var top = document.getElementById('top');
        if (top) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  function showLeftPanel(id, resetScroll) {
    if (resetScroll === undefined) resetScroll = true;
    if (mobileMq.matches && id === 'side') id = 'intro';
    ['intro', 'about', 'side'].forEach(function (p) {
      var el = document.getElementById('panel-left-' + p);
      if (el) el.hidden = p !== id;
    });
    if (leftScrollEl) {
      leftScrollEl.classList.toggle('is-intro', id === 'intro');
      if (resetScroll && !mobileMq.matches) leftScrollEl.scrollTop = 0;
    }
    if (homeLeftEl) homeLeftEl.classList.toggle('is-subpanel', id !== 'intro');
    var homeShellEl = document.querySelector('.home-shell');
    if (homeShellEl) {
      homeShellEl.classList.toggle('is-mobile-about', mobileMq.matches && id === 'about');
    }
    if (mobileMq.matches) {
      document.querySelectorAll('.left-tab-row').forEach(function (row) {
        row.classList.toggle('is-active-row', row.getAttribute('data-left-row') === id);
      });
      leftCloseBtns.forEach(function (btn) {
        btn.hidden = btn.getAttribute('data-close') !== id;
      });
      syncLeftNav(id === 'intro' ? null : id);
      syncMobileNav(id);
      scrollMobilePanel(id);
    }
    if (!currentCaseUrl) {
      document.title = id === 'about' ? ABOUT_TITLE : PAGE_TITLE;
    }
  }

  function focusRightWork(opts) {
    opts = opts || {};
    if (mobileMq.matches) {
      showWorkPanel({ scrollY: opts.y, scrollTop: opts.scrollTop });
      return;
    }
    showWorkPanel({
      scrollY: opts.scrollY !== undefined ? opts.scrollY : opts.y,
      scrollTop: opts.scrollTop,
    });
    if (opts.expandAll) expandAllTapes();
  }

  function scrollToStupid(smooth) {
    if (mobileMq.matches) {
      showWorkPanel({ scrollY: workScrollYBeforeCase, scrollTop: false });
      var tapeMobile = document.getElementById('work-stupid');
      if (!tapeMobile) return;
      tapeMobile.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant', block: 'start' });
      return;
    }
    if (currentCaseUrl) {
      showWorkPanel({ scrollY: workScrollYBeforeCase, scrollTop: false });
    }
    expandAllTapes();
    var tape = document.getElementById('work-stupid');
    if (!tape || !rightScrollEl) return;
    if (location.hash !== '#work-stupid') history.pushState(null, '', '#work-stupid');

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var useSmooth = smooth && !reducedMotion;
    var delay = useSmooth ? 400 : 0;

    function focusStupidCard() {
      var tapeRect = tape.getBoundingClientRect();
      var scrollRect = rightScrollEl.getBoundingClientRect();
      var top = rightScrollEl.scrollTop + (tapeRect.top - scrollRect.top) - 8;
      rightScrollEl.scrollTo({ top: Math.max(0, top), behavior: useSmooth ? 'smooth' : 'instant' });
    }

    setTimeout(function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(focusStupidCard);
      });
    }, delay);
  }

  function stateFromHash() {
    var hash = location.hash;
    if (!hash || hash === '#top') return {};
    var caseUrl = urlFromHash(hash);
    if (caseUrl) return { loadCase: caseUrl };
    if (hash === '#about') return { left: 'about' };
    if (hash === '#side') return { left: 'side' };
    if (hash === '#work-stupid') return { scrollStupid: true };
    if (hash === '#work') return { focusWork: true };
    return {};
  }

  function applyPanelFromHash() {
    var state = stateFromHash();
    if (!mobileMq.matches) {
      if (state.loadCase) {
        if (currentCaseUrl !== state.loadCase) loadCaseInRight(state.loadCase, false);
      } else if (state.focusWork) {
        showWorkPanel({ scrollY: workScrollYBeforeCase, scrollTop: false });
        expandAllTapes();
      } else if (state.left === 'about') {
        activateLeftTab('about', { skipHash: true });
      } else if (state.left === 'side') {
        activateLeftTab('side', { skipHash: true });
      } else if (state.scrollStupid) {
        requestAnimationFrame(function () {
          scrollToStupid(false);
        });
      } else if (currentCaseUrl && (location.hash === '#work' || location.hash === '')) {
        showWorkPanel({ scrollY: workScrollYBeforeCase });
      } else {
        setDesktopHomeDefault({ skipHash: true, resetScroll: false });
      }
    } else {
      if (state.left) {
        if (state.left === 'side') {
          requestAnimationFrame(function () {
            scrollToStupid(false);
          });
        } else {
          showLeftPanel(state.left);
        }
      }
      if (state.loadCase) {
        if (currentCaseUrl !== state.loadCase) loadCaseInRight(state.loadCase, false);
      } else if (state.focusWork) {
        focusRightWork({ scrollY: workScrollYBeforeCase });
      } else if (location.hash === '#work' || location.hash === '') {
        if (currentCaseUrl) showWorkPanel({ scrollY: workScrollYBeforeCase });
      }
      if (state.scrollStupid) {
        requestAnimationFrame(function () {
          scrollToStupid(false);
        });
      }
    }
    var hash = location.hash;
    if (hash && hash !== '#about' && hash !== '#side' && hash !== '#top' && hash !== '#work' && hash !== '#work-stupid' && hash.indexOf('#case-') !== 0) {
      var target = document.querySelector(hash);
      if (target) target.scrollIntoView();
    }
  }

  document.querySelectorAll('.desk-tab').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (mobileMq.matches) return;
      e.preventDefault();
      e.stopPropagation();
      var tab = link.getAttribute('data-desk-tab');
      if (!tab || tab === 'work') return;
      activateLeftTab(tab);
    });
  });

  if (deskWorkTitle) {
    deskWorkTitle.addEventListener('click', onDeskWorkTitleClick);
    syncWorkTitleState();
  }

  deskCloseBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (mobileMq.matches) return;
      setDesktopHomeDefault();
    });
  });

  document.querySelectorAll('.desk-tab-wrap').forEach(function (wrap) {
    wrap.addEventListener('click', function () {
      if (mobileMq.matches || !wrap.classList.contains('is-active-wrap')) return;
      setDesktopHomeDefault();
    });
  });

  document.querySelectorAll('.left-tab').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (mobileMq.matches) return;
      e.preventDefault();
      e.stopPropagation();
      var id = link.getAttribute('data-left');
      if (!id) return;
      var hash = id === 'side' ? '#side' : '#about';
      if (location.hash !== hash) history.pushState(null, '', hash);
      showLeftPanel(id);
    });
  });

  document.querySelectorAll('.nav-tab').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var panel = link.getAttribute('data-panel');
      if (mobileMq.matches) {
        if (panel === 'work') {
          if (location.hash !== '#work') history.pushState(null, '', '#work');
          showLeftPanel('intro', false);
          var work = document.getElementById('work');
          if (work) work.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        if (panel === 'about') {
          if (location.hash !== '#about') history.pushState(null, '', '#about');
          showLeftPanel('about');
        }
        return;
      }
      if (panel === 'work') {
        if (location.hash !== '#work') history.pushState(null, '', '#work');
        focusRightWork({ scrollY: workScrollYBeforeCase });
      } else if (panel === 'about') {
        if (location.hash !== '#about') history.pushState(null, '', '#about');
        activateLeftTab('about');
      }
    });
  });

  leftCloseBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (location.hash) history.pushState(null, '', '#top');
      showLeftPanel('intro');
    });
  });

  document.querySelectorAll('.left-tab-row').forEach(function (row) {
    row.addEventListener('click', function () {
      if (mobileMq.matches || !row.classList.contains('is-active-row')) return;
      if (location.hash) history.pushState(null, '', '#top');
      showLeftPanel('intro');
    });
  });

  var brand = document.querySelector('.brand');
  if (brand) {
    brand.addEventListener('click', function (e) {
      e.preventDefault();
      if (mobileMq.matches) {
        if (location.hash) history.pushState(null, '', '#top');
        showLeftPanel('intro');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setDesktopHomeDefault();
    });
  }

  window.addEventListener('hashchange', applyPanelFromHash);
  window.addEventListener('popstate', applyPanelFromHash);

  restoreHomeState();
  applyPanelFromHash();
  syncMobileTapes();
  var aboutOpenOnLoad =
    document.getElementById('panel-left-about') &&
    !document.getElementById('panel-left-about').hidden;
  var homeShellOnLoad = document.querySelector('.home-shell');
  if (homeShellOnLoad) {
    homeShellOnLoad.classList.toggle('is-mobile-about', mobileMq.matches && aboutOpenOnLoad);
  }
  syncMobileNav(aboutOpenOnLoad ? 'about' : 'intro');

  mobileMq.addEventListener('change', function () {
    syncMobileTapes();
    var aboutOpen =
      document.getElementById('panel-left-about') &&
      !document.getElementById('panel-left-about').hidden;
    var homeShellEl = document.querySelector('.home-shell');
    if (homeShellEl) {
      homeShellEl.classList.toggle('is-mobile-about', mobileMq.matches && aboutOpen);
    }
    if (mobileMq.matches) {
      syncMobileNav(aboutOpen ? 'about' : 'intro');
    }
    syncWorkTitleState();
  });

  function handleViewMoreClick(e) {
    var link = e.target.closest('a.viewmore');
    if (!link) return;
    e.preventDefault();
    e.stopPropagation();
    var href = link.getAttribute('href');
    if (!href || href.indexOf('case-') === -1) return;
    goCase(href, e);
  }

  document.addEventListener('click', handleViewMoreClick, true);

  document.querySelectorAll('#stack .tape').forEach(function (tape) {
    var url = tape.getAttribute('data-case');
    if (!url) return;
    tape.addEventListener('click', function (e) {
      if (e.target.closest('a.viewmore')) return;
      if (e.target.closest('a[href]')) return;
      if (mobileMq.matches) {
        e.preventDefault();
        window.location.href = url;
        return;
      }
      if (e.target.closest('.cap-r')) return;
      if (e.target.closest('.slotwrap') || e.target.closest('.d-block')) {
        e.preventDefault();
        goCase(url);
        return;
      }
      if (e.target.closest('.spine')) {
        e.preventDefault();
        tape.classList.toggle('is-open');
        syncWorkTitleState();
      }
    });
  });

  setTimeout(revealHome, 500);

  document.querySelectorAll('.jump-stupid').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (location.hash !== '#work-stupid') history.pushState(null, '', '#work-stupid');
      scrollToStupid(true);
    });
  });
})();
