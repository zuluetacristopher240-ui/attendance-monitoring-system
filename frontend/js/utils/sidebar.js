/**
 * sidebar.js
 * Sidebar toggle — collapsible sidebar, HIDDEN by default.
 */

(function() {
  const SIDEBAR_KEY = 'sidebarHidden';
  const MOBILE_BREAKPOINT = 768;

  function isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function getSidebar() {
    return document.querySelector('.sidebar');
  }

  function getOverlay() {
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', hideSidebar);
    }
    return overlay;
  }

  function showSidebar() {
    const sidebar = getSidebar();
    if (!sidebar) return;
    sidebar.classList.remove('hidden');
    document.body.classList.remove('sidebar-hidden');
    localStorage.setItem(SIDEBAR_KEY, 'false');

    if (isMobile()) {
      getOverlay().classList.add('active');
    }
  }

  function hideSidebar() {
    const sidebar = getSidebar();
    if (!sidebar) return;
    sidebar.classList.add('hidden');
    document.body.classList.add('sidebar-hidden');
    localStorage.setItem(SIDEBAR_KEY, 'true');

    getOverlay().classList.remove('active');
  }

  function toggleSidebar(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const sidebar = getSidebar();
    if (!sidebar) return;

    if (sidebar.classList.contains('hidden')) {
      showSidebar();
    } else {
      hideSidebar();
    }
  }

  function init() {
    const sidebar = getSidebar();
    if (!sidebar) {
      console.warn('❌ Sidebar not found');
      return;
    }

    // ✅ DEFAULT: NAKA-HIDDEN lagi pag-load
    sidebar.classList.add('hidden');
    document.body.classList.add('sidebar-hidden');

    // ✅ Event delegation sa click
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.sidebar-toggle');
      if (!btn) return;
      toggleSidebar(e);
    });
  }

  window.addEventListener('resize', function() {
    const sidebar = getSidebar();
    if (!sidebar) return;

    if (isMobile()) {
      if (!sidebar.classList.contains('hidden')) {
        getOverlay().classList.add('active');
      }
    } else {
      getOverlay().classList.remove('active');
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();