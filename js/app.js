// ShuttleStats Web Application - Main JavaScript File

// ==================== AUTHENTICATION ====================
// Note: Authentication is now handled by auth-service.js
// This class is kept for backward compatibility but delegates to auth-service

class AuthManager {
  constructor() {
    console.warn("AuthManager is deprecated. Use authService from auth-service.js instead");
    this.currentUser = null;
  }

  // Delegate to auth service if available
  isAuthenticated() {
    if (window.authService) {
      return window.authService.isAuthenticated();
    }
    // Fallback for backward compatibility
    const storedUser = localStorage.getItem("shuttlestats-user");
    return !!storedUser;
  }

  getCurrentUser() {
    if (window.authService) {
      return window.authService.getCurrentUser();
    }
    // Fallback for backward compatibility
    const storedUser = localStorage.getItem("shuttlestats-user");
    return storedUser ? JSON.parse(storedUser) : null;
  }

  logout() {
    if (window.authService) {
      window.authService.signOut();
    } else {
      // Fallback
      localStorage.removeItem("shuttlestats-user");
      window.location.href = "index.html";
    }
  }
}

// ==================== UI COMPONENTS ====================
// Note: UI components have been moved to common-ui.js for better organization

class ModalManager {
  constructor() {
    console.warn("ModalManager is deprecated. Use specific modal implementations in service files");
    this.setupModalListeners();
  }

  setupModalListeners() {
    // Close modal when clicking outside
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        this.closeModal(e.target.id);
      }
    });

    // Close modal with escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAllModals();
      }
    });
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = "flex";
      document.body.style.overflow = "hidden";
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  }

  closeAllModals() {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      modal.style.display = "none";
    });
    document.body.style.overflow = "auto";
  }
}

// Simplified managers - actual functionality moved to common-ui.js
class SidebarManager {
  constructor() {
    console.warn("SidebarManager is deprecated. Use setupSidebar() from common-ui.js");
    // Delegate to common-ui.js implementation
    if (window.setupSidebar) {
      window.setupSidebar();
    }
  }
}

class DropdownManager {
  constructor() {
    console.warn("DropdownManager is deprecated. Use setupDropdown() from common-ui.js");
    // Delegate to common-ui.js implementation  
    if (window.setupDropdown) {
      window.setupDropdown();
    }
  }
}

// ==================== PAGE MANAGERS ====================

class LandingPage {
  constructor(authManager, modalManager) {
    this.authManager = authManager;
    this.modalManager = modalManager;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateCurrentDate();
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }

    // Sign up form
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
      signupForm.addEventListener("submit", (e) => this.handleSignUp(e));
    }

    // Modal triggers
    const loginLink = document.querySelector('a[href="#login"]');
    if (loginLink) {
      loginLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.modalManager.openModal("loginModal");
      });
    }

    const signupLink = document.getElementById("signupLink");
    if (signupLink) {
      signupLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.modalManager.closeModal("loginModal");
        this.modalManager.openModal("signupModal");
      });
    }

    const loginFromSignupLink = document.getElementById("loginFromSignupLink");
    if (loginFromSignupLink) {
      loginFromSignupLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.modalManager.closeModal("signupModal");
        this.modalManager.openModal("loginModal");
      });
    }

    // Close modal buttons
    const closeButtons = document.querySelectorAll(".close");
    closeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal");
        if (modal) {
          this.modalManager.closeModal(modal.id);
        }
      });
    });
  }

  async handleLogin(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const credentials = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    // Basic validation
    if (!credentials.email || !credentials.password) {
      alert("Please fill in both email and password.");
      return;
    }

    const result = await this.authManager.login(credentials);

    if (result.success) {
      this.modalManager.closeModal("loginModal");

      // Store user data for dashboard
      localStorage.setItem("userRole", result.user.role);
      localStorage.setItem("userEmail", result.user.email);

      alert(`Welcome to ShuttleStats! Logging in as ${result.user.role}...`);
      window.location.href = "dashboard.html";
    } else {
      alert(
        `Login failed: Invalid credentials.\n\nDemo accounts available:\n\nPlayer Demo:\nEmail: practice@gmail.com\nPassword: password123\n\nCoach Demo:\nEmail: coachpractice@gmail.com  \nPassword: password123\n\nOr create a new account by clicking 'Sign up here'.`
      );
    }
  }

  async handleSignUp(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const userData = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      role: formData.get("role"),
      terms: formData.get("terms") === "on",
    };

    // Basic validation
    if (
      !userData.name ||
      !userData.email ||
      !userData.password ||
      !userData.role
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    const result = await this.authManager.signUp(userData);

    if (result.success) {
      alert(result.message);
      this.modalManager.closeModal("signupModal");
      this.modalManager.openModal("loginModal");
      // Clear form
      e.target.reset();
    } else {
      alert(`Sign up failed: ${result.error}`);
    }
  }

  updateCurrentDate() {
    const dateElement = document.getElementById("currentDate");
    if (dateElement) {
      const now = new Date();
      dateElement.textContent = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }
}

class DashboardPage {
  constructor(authManager, sidebarManager, dropdownManager) {
    this.authManager = authManager;
    this.sidebarManager = sidebarManager;
    this.dropdownManager = dropdownManager;
    this.init();
  }

  init() {
    // Check authentication
    if (!this.authManager.isAuthenticated()) {
      window.location.href = "index.html";
      return;
    }

    const user = this.authManager.getCurrentUser();
    this.setupDashboard(user);
    this.setupEventListeners();
    this.updateCurrentDate();
  }

  setupDashboard(user) {
    // Load and display user's first name
    if (window.loadUserName) {
      loadUserName("#userName");
    } else {
      // Fallback if common-ui.js not loaded
      const userNameElement = document.getElementById("userName");
      if (userNameElement) {
        userNameElement.textContent = `Welcome back, ${user.name}!`;
      }
    }

    // Show appropriate sidebar sections
    const playerSection = document.getElementById("playerSection");
    const coachSection = document.getElementById("coachSection");

    if (user.role === "coach") {
      if (playerSection) playerSection.style.display = "none";
      if (coachSection) coachSection.style.display = "block";
      // Stats are managed by DashboardManager in dashboard.html; avoid overriding with hardcoded values.
    } else {
      if (playerSection) playerSection.style.display = "block";
      if (coachSection) coachSection.style.display = "none";
      // Stats are managed by DashboardManager in dashboard.html; avoid overriding with hardcoded values.
    }
  }

  updateStat(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  setupEventListeners() {
    // Logout functionality - handled in dashboard.html

    // Menu item functionality
    this.setupMenuItems();

    // Quick action buttons
    this.setupQuickActions();
  }

  setupMenuItems() {
    const menuItems = document.querySelectorAll(".menu-item");
    menuItems.forEach((item) => {
      if (!item.onclick) {
        item.addEventListener("click", (e) => {
          const href = item.getAttribute("href");

          // Allow navigation to actual HTML pages
          if (
            href === "training.html" ||
            href === "matches.html" ||
            href === "schedule.html"
          ) {
            return; // Let the browser handle the navigation
          }

          // For dashboard link, just handle active state
          if (href === "#dashboard") {
            e.preventDefault();
            menuItems.forEach((mi) => mi.classList.remove("active"));
            item.classList.add("active");
            return;
          }

          // For other features not yet implemented
          e.preventDefault();

          // Remove active class from all items
          menuItems.forEach((mi) => mi.classList.remove("active"));

          // Add active class to clicked item
          item.classList.add("active");

          // Get the menu item text to determine action
          const text = item.textContent.trim();
          this.handleMenuClick(text);
        });
      }
    });
  }

  setupQuickActions() {
    const actionButtons = document.querySelectorAll(".action-btn");
    actionButtons.forEach((btn) => {
      if (!btn.onclick) {
        btn.addEventListener("click", () => {
          const text = btn.textContent.trim();
          alert(`${text} feature coming soon!`);
        });
      }
    });
  }

  handleMenuClick(menuText) {
    // Handle different menu clicks
    if (menuText.includes("Dashboard")) {
      // Already on dashboard
      return;
    } else if (menuText.includes("Training")) {
      // Navigation handled by browser - this shouldn't be called
      return;
    } else if (menuText.includes("Matches")) {
      // Navigation handled by browser - this shouldn't be called
      return;
    } else if (menuText.includes("Schedule")) {
      window.location.href = "schedule.html";
    } else if (menuText.includes("Progress")) {
      alert("Progress tracking feature coming soon!");
    } else if (menuText.includes("Achievements")) {
      alert("Achievements feature coming soon!");
    } else if (menuText.includes("Goals")) {
      alert("Goals feature coming soon!");
    } else if (menuText.includes("My Players")) {
      alert("Player management feature coming soon!");
    } else if (menuText.includes("Training Plans")) {
      alert("Training plans feature coming soon!");
    } else if (menuText.includes("Feedback")) {
      alert("Feedback feature coming soon!");
    } else if (menuText.includes("Reports")) {
      alert("Reports feature coming soon!");
    }
  }

  updateCurrentDate() {
    const dateElement = document.getElementById("currentDate");
    if (dateElement) {
      const now = new Date();
      dateElement.textContent = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }
}

// ==================== APPLICATION INITIALIZATION ====================
// Note: Modern authentication now handled by auth-service.js

class ShuttleStatsApp {
  constructor() {
    console.log("ShuttleStatsApp initializing...");
    this.authManager = new AuthManager();
    this.modalManager = new ModalManager();
    this.sidebarManager = null;
    this.dropdownManager = null;
    this.currentPage = null;

    this.init();
  }

  init() {
    // Initialize common UI components
    if (window.setupSidebar) window.setupSidebar();
    if (window.setupDropdown) window.setupDropdown();
    
    // Determine which page we're on
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf("/") + 1);
    console.log("Current page:", page);

    // Let dashboard.html own its logic via its inline script to avoid duplication
    if (page === "dashboard.html") {
      console.log("Dashboard page - delegating to dashboard.html inline scripts");
      return;
    }

    // Landing page (index.html or served root)
    console.log("Initializing landing page");
    this.currentPage = new LandingPage(this.authManager, this.modalManager);
  }
}

// ==================== GLOBAL FUNCTIONS ====================

// Global logout function for backward compatibility
function logout() {
  if (window.shuttleStatsApp && window.shuttleStatsApp.authManager) {
    window.shuttleStatsApp.authManager.logout();
  }
}

// ==================== INITIALIZE APP ====================

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.shuttleStatsApp = new ShuttleStatsApp();

  // Make the ShuttleStats logo navigate to dashboard from any non-index page
  try {
    const page = window.location.pathname.split("/").pop().toLowerCase();
    if (page !== "index.html" && page !== "") {
      const logo = document.querySelector(".nav-logo");
      const logoText = document.querySelector(".logo-text");
      const navigateToDashboard = (e) => {
        e.preventDefault();
        window.location.href = "dashboard.html";
      };
      [logo, logoText].forEach((el) => {
        if (el) {
          el.style.cursor = "pointer";
          // Avoid duplicate bindings by cloning approach is overkill; simple add is fine per load
          el.addEventListener("click", navigateToDashboard, { once: false });
        }
      });
    }
  } catch (_) {
    // no-op
  }
});
