// Shared empty state rendering utilities
export class EmptyStateRenderer {
  static renderEmptyState(containerId, config) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
      icon = "📝",
      title = "No data yet",
      message = "Start adding data to see it here!",
      buttonText = "Add First Item",
      buttonId = "addFirstBtn",
      onButtonClick = null,
    } = config;

    container.innerHTML = `
      <div class="no-data">
        <div class="empty-state">
          <span class="empty-icon">${icon}</span>
          <h3>${title}</h3>
          <p>${message}</p>
          ${
            buttonText
              ? `<button class="btn btn-primary" id="${buttonId}">${buttonText}</button>`
              : ""
          }
        </div>
      </div>
    `;

    // Add click handler if provided
    if (buttonText && onButtonClick) {
      const button = document.getElementById(buttonId);
      if (button) {
        button.addEventListener("click", onButtonClick);
      }
    }
  }

  static renderFilteredEmptyState(containerId, filterType = "search") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const configs = {
      search: {
        icon: "🔍",
        title: "No results found",
        message: "Try adjusting your filters or search terms.",
        buttonText: null,
      },
      filter: {
        icon: "🔍",
        title: "No items match your filters",
        message: "Try adjusting your filters to see more results.",
        buttonText: null,
      },
      date: {
        icon: "📅",
        title: "No data for this period",
        message: "Try selecting a different date range.",
        buttonText: null,
      },
    };

    const config = configs[filterType] || configs.search;
    this.renderEmptyState(containerId, config);
  }

  static addEmptyStateStyles() {
    if (document.getElementById("emptyStateStyles")) return;

    const style = document.createElement("style");
    style.id = "emptyStateStyles";
    style.textContent = `
      .no-data {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
        padding: 40px 20px;
      }
      .empty-state {
        text-align: center;
        max-width: 400px;
      }
      .empty-icon {
        font-size: 3rem;
        display: block;
        margin-bottom: 16px;
        opacity: 0.7;
      }
      .empty-state h3 {
        margin: 0 0 8px 0;
        color: #374151;
        font-size: 1.2rem;
      }
      .empty-state p {
        margin: 0 0 20px 0;
        color: #6b7280;
        line-height: 1.5;
      }
      .empty-state .btn {
        padding: 10px 20px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
      }
      .empty-state .btn:hover {
        background: #2563eb;
      }
    `;
    document.head.appendChild(style);
  }
}

// Also make it available globally for non-module scripts
if (typeof window !== "undefined") {
  window.EmptyStateRenderer = EmptyStateRenderer;
}

// Auto-add styles when imported
document.addEventListener("DOMContentLoaded", () => {
  EmptyStateRenderer.addEmptyStateStyles();
});
