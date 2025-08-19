// ShuttleStats Web Application - Main JavaScript File

// ==================== AUTHENTICATION ====================

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    // Check if user is already logged in
    const storedUser = localStorage.getItem("shuttlestats-user");
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
    }
  }

  // Demo accounts
  getDemoAccounts() {
    return [
      { email: "practice@gmail.com", password: "password123", role: "player" },
      {
        email: "coachpractice@gmail.com",
        password: "password123",
        role: "coach",
      },
    ];
  }

  // Login functionality
  async login(credentials) {
    const { email, password } = credentials;

    // Check demo accounts
    const demoAccount = this.getDemoAccounts().find(
      (account) => account.email === email && account.password === password
    );

    if (demoAccount) {
      const user = {
        id: demoAccount.email === "practice@gmail.com" ? "1" : "2",
        email: demoAccount.email,
        name: demoAccount.email.split("@")[0],
        role: demoAccount.role,
        createdAt: new Date().toISOString(),
      };

      this.currentUser = user;
      localStorage.setItem("shuttlestats-user", JSON.stringify(user));
      return { success: true, user };
    }

    // Check registered users
    const registeredUsers = JSON.parse(
      localStorage.getItem("shuttleStatsUsers") || "[]"
    );
    const user = registeredUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      const loginUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      };

      this.currentUser = loginUser;
      localStorage.setItem("shuttlestats-user", JSON.stringify(loginUser));
      return { success: true, user: loginUser };
    }

    return { success: false, error: "Invalid credentials" };
  }

  // Sign up functionality
  async signUp(userData) {
    const { name, email, password, confirmPassword, role, terms } = userData;

    // Validation
    if (password !== confirmPassword) {
      return { success: false, error: "Passwords do not match" };
    }

    if (!terms) {
      return {
        success: false,
        error: "Please accept the terms and conditions",
      };
    }

    // Check if user already exists
    const existingUsers = JSON.parse(
      localStorage.getItem("shuttleStatsUsers") || "[]"
    );
    const demoEmails = this.getDemoAccounts().map((account) => account.email);

    if (
      existingUsers.some((u) => u.email === email) ||
      demoEmails.includes(email)
    ) {
      return { success: false, error: "User with this email already exists" };
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      role,
      createdAt: new Date().toISOString(),
    };

    existingUsers.push(newUser);
    localStorage.setItem("shuttleStatsUsers", JSON.stringify(existingUsers));

    return { success: true, message: "Account created successfully!" };
  }

  // Logout functionality
  logout() {
    this.currentUser = null;
    localStorage.removeItem("shuttlestats-user");
    window.location.href = "index.html";
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }
}

// ==================== UI COMPONENTS ====================

class ModalManager {
  constructor() {
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

class SidebarManager {
  constructor() {
    this.isOpen = false;
    this.setupSidebar();
  }

  setupSidebar() {
    const toggleBtn = document.getElementById("sidebarToggle");
    const overlay = document.getElementById("sidebarOverlay");
    const sidebar = document.getElementById("sidebar");

    if (toggleBtn && overlay && sidebar) {
      toggleBtn.addEventListener("click", () => this.toggle());
      overlay.addEventListener("click", () => this.close());

      // Close on escape key
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.isOpen) {
          this.close();
        }
      });

      // Auto-close on menu item click for mobile
      const menuItems = document.querySelectorAll(".menu-item");
      menuItems.forEach((item) => {
        item.addEventListener("click", () => {
          if (window.innerWidth <= 768) {
            this.close();
          }
        });
      });
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    const toggleBtn = document.getElementById("sidebarToggle");
    const overlay = document.getElementById("sidebarOverlay");
    const sidebar = document.getElementById("sidebar");

    if (sidebar) sidebar.classList.add("active");
    if (overlay) overlay.classList.add("active");
    if (toggleBtn) toggleBtn.classList.add("active");

    this.isOpen = true;
  }

  close() {
    const toggleBtn = document.getElementById("sidebarToggle");
    const overlay = document.getElementById("sidebarOverlay");
    const sidebar = document.getElementById("sidebar");

    if (sidebar) sidebar.classList.remove("active");
    if (overlay) overlay.classList.remove("active");
    if (toggleBtn) toggleBtn.classList.remove("active");

    this.isOpen = false;
  }
}

class DropdownManager {
  constructor() {
    // Only setup dropdowns if we're on the landing page
    // Dashboard has its own dropdown handling
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf("/") + 1);

    if (page !== "dashboard.html") {
      this.setupDropdowns();
    }
  }

  setupDropdowns() {
    const dropdownToggle = document.querySelector(".dropdown-toggle");
    const dropdownMenu = document.querySelector(".dropdown-menu");

    if (dropdownToggle && dropdownMenu) {
      dropdownToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle("show");
      });

      // Close dropdown when clicking outside
      document.addEventListener("click", () => {
        dropdownMenu.classList.remove("show");
      });
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

class ShuttleStatsApp {
  constructor() {
    this.authManager = new AuthManager();
    this.modalManager = new ModalManager();
    this.sidebarManager = null;
    this.dropdownManager = null;
    this.currentPage = null;

    this.init();
  }

  init() {
    // Determine which page we're on
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf("/") + 1);

    // Let dashboard.html own its logic via its inline script to avoid duplication
    if (page === "dashboard.html") {
      return;
    }

    // Landing page (index.html or served root)
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
