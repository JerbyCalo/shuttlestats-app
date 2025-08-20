// Landing page scripts (moved from inline for CSP compatibility)
// Smooth scrolling for in-page navigation links
(function () {
  try {
    // Mobile nav toggle
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-menu');
    const overlay = document.querySelector('.nav-overlay');
    if (toggle && menu && overlay) {
      const closeMenu = () => {
        menu.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        overlay.setAttribute('hidden', '');
        document.body.style.overflow = '';
      };
      const openMenu = () => {
        menu.classList.add('open');
        toggle.classList.add('active');
        toggle.setAttribute('aria-expanded', 'true');
        overlay.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
      };
      toggle.addEventListener('click', () => {
        const isOpen = menu.classList.contains('open');
        isOpen ? closeMenu() : openMenu();
      });
      overlay.addEventListener('click', closeMenu);
      // Close on ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
      });
      // Close when a menu item is chosen
      menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        const href = this.getAttribute("href") || "";
        if (!href || href === "#") return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  } catch (_) {}
})();
