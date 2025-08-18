// Common UI helpers for dropdowns and sidebar used across app pages
// Not an ES module; attaches helpers to window for easy use from any script
(function () {
  function setupDropdown() {
    try {
      const toggle = document.querySelector(".dropdown-toggle");
      const menu = document.querySelector(".dropdown-menu");
      if (!toggle || !menu) return;

      // Prevent duplicate bindings
      if (toggle.dataset.bound === "true") return;
      toggle.dataset.bound = "true";

      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        menu.classList.toggle("show");
      });

      document.addEventListener("click", function (e) {
        if (!menu.contains(e.target) && !toggle.contains(e.target)) {
          menu.classList.remove("show");
        }
      });
    } catch (err) {
      // silent fail
    }
  }

  function setupSidebar() {
    try {
      const sidebarToggle = document.getElementById("sidebarToggle");
      const sidebar = document.getElementById("sidebar");
      const overlay = document.getElementById("sidebarOverlay");
      if (!sidebarToggle || !sidebar || !overlay) return;

      // Prevent duplicate bindings
      if (sidebarToggle.dataset.bound === "true") return;
      sidebarToggle.dataset.bound = "true";

      const toggle = () => {
        sidebar.classList.toggle("active");
        overlay.classList.toggle("active");
        sidebarToggle.classList.toggle("active");
      };

      const close = () => {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
        sidebarToggle.classList.remove("active");
      };

      sidebarToggle.addEventListener("click", (e) => {
        e.preventDefault();
        toggle();
      });
      overlay.addEventListener("click", close);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && sidebar.classList.contains("active")) {
          close();
        }
      });

      // Auto-close on menu item click for mobile
      document.querySelectorAll(".menu-item").forEach((item) => {
        item.addEventListener("click", () => {
          if (window.innerWidth <= 768) close();
        });
      });
    } catch (err) {
      // silent fail
    }
  }

  // Expose globally
  window.setupDropdown = setupDropdown;
  window.setupSidebar = setupSidebar;
})();
