// Toast Notification System
class ToastManager {
  constructor() {
    this.container = this.createContainer();
  }

  createContainer() {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = "info", duration = 5000) {
    const toast = this.createToast(message, type);
    this.container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add("show"), 100);

    // Auto remove
    if (duration > 0) {
      setTimeout(() => this.remove(toast), duration);
    }

    return toast;
  }

  createToast(message, type) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };

    const titles = {
      success: "Success",
      error: "Error",
      warning: "Warning",
      info: "Information",
    };

    toast.innerHTML = `
      <div class="toast-header">
        <span class="toast-title">${icons[type]} ${titles[type]}</span>
        <button class="toast-close" onclick="toastManager.remove(this.closest('.toast'))">&times;</button>
      </div>
      <div class="toast-message">${message}</div>
    `;

    return toast;
  }

  remove(toast) {
    toast.classList.remove("show");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  success(message, duration = 5000) {
    return this.show(message, "success", duration);
  }

  error(message, duration = 7000) {
    return this.show(message, "error", duration);
  }

  warning(message, duration = 6000) {
    return this.show(message, "warning", duration);
  }

  info(message, duration = 5000) {
    return this.show(message, "info", duration);
  }
}

// Global toast manager instance
const toastManager = new ToastManager();

// Utility functions for easy access
window.showToast = (message, type, duration) =>
  toastManager.show(message, type, duration);
window.showSuccess = (message, duration) =>
  toastManager.success(message, duration);
window.showError = (message, duration) => toastManager.error(message, duration);
window.showWarning = (message, duration) =>
  toastManager.warning(message, duration);
window.showInfo = (message, duration) => toastManager.info(message, duration);

export { ToastManager, toastManager };
