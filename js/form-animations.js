// Shared form animation utilities
export class FormAnimations {
  static showForm(formId, historyId, buttonId, backText = "⬅️ Back") {
    const form = document.getElementById(formId);
    const history = document.getElementById(historyId);
    const button = document.getElementById(buttonId);

    if (!form || !history || !button) {
      console.warn("FormAnimations: Missing elements for showForm");
      return;
    }

    // Show form with animation
    form.style.display = "block";
    history.style.display = "none";

    // Entrance animation
    form.style.opacity = "0";
    form.style.transform = "translateY(20px)";

    setTimeout(() => {
      form.style.transition = "all 0.5s ease";
      form.style.opacity = "1";
      form.style.transform = "translateY(0)";
    }, 100);

    // Update button
    button.innerHTML = `<span class="btn-icon">${backText}</span>`;
    button.classList.add("btn-back");

    // Smooth scroll to form
    form.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  static hideForm(
    formId,
    historyId,
    buttonId,
    originalText,
    originalIcon = "➕"
  ) {
    const form = document.getElementById(formId);
    const history = document.getElementById(historyId);
    const button = document.getElementById(buttonId);

    if (!form || !history || !button) {
      console.warn("FormAnimations: Missing elements for hideForm");
      return;
    }

    // Exit animation
    form.style.transition = "all 0.3s ease";
    form.style.opacity = "0";
    form.style.transform = "translateY(-20px)";

    setTimeout(() => {
      form.style.display = "none";
      history.style.display = "block";

      // Reset styles
      form.style.opacity = "";
      form.style.transform = "";
      form.style.transition = "";
    }, 300);

    // Reset button
    button.innerHTML = `<span class="btn-icon">${originalIcon}</span> ${originalText}`;
    button.classList.remove("btn-back");
  }

  static replaceButtonListener(buttonId, newHandler) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    // Clone button to remove all event listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    // Add new event listener
    newButton.addEventListener("click", newHandler);

    return newButton;
  }

  static resetFormWithFade(formId, resetCallback) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.style.transition = "opacity 0.3s ease";
    form.style.opacity = "0.5";

    setTimeout(() => {
      if (resetCallback) resetCallback();
      form.style.opacity = "1";
      setTimeout(() => {
        form.style.transition = "";
      }, 300);
    }, 150);
  }
}

// Also make it available globally for non-module scripts
if (typeof window !== "undefined") {
  window.FormAnimations = FormAnimations;
}
