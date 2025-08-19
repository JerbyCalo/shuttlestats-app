// Landing page scripts (moved from inline for CSP compatibility)
// Smooth scrolling for in-page navigation links
(function () {
  try {
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
  } catch (err) {
    // Ignore errors in older browsers or non-DOM environments
    // Ensure block is not empty for ESLint no-empty
    console.debug("landing: smooth scroll init skipped", err);
  }
})();
