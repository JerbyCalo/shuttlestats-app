// Dashboard Quick Actions binding (no inline onclick)
(function () {
  try {
    // Function to bind quick action buttons
    function bindQuickActions() {
      const buttons = {
        qaLogTraining: () => (window.location.href = "training.html"),
        qaRecordMatch: () => (window.location.href = "matches.html"),
        qaViewSchedule: () => (window.location.href = "schedule.html"),
        qaSetGoal: async () => {
          try {
            if (!window.dataService || !window.authService) {
              alert("Please log in to set goals.");
              return;
            }
            const title = prompt(
              "What's your new goal? (e.g., 3x training this week)"
            );
            if (!title) return;

            const targetDate = prompt("Target date (YYYY-MM-DD), optional:");
            const payload = { title: title.trim(), completed: false };
            if (targetDate && /\d{4}-\d{2}-\d{2}/.test(targetDate)) {
              payload.targetDate = targetDate;
            }

            await window.dataService.addGoal(payload);
            alert("Goal added!");

            // Refresh dashboard if available
            if (window.refreshDashboard) {
              window.refreshDashboard();
            }
          } catch (e) {
            console.error("Error adding goal:", e);
            alert("Failed to add goal. Try again.");
          }
        },
      };

      // Bind each button
      Object.keys(buttons).forEach((buttonId) => {
        const button = document.getElementById(buttonId);
        if (button && !button.dataset.bound) {
          button.dataset.bound = "true";
          button.addEventListener("click", buttons[buttonId]);
          console.log(`Bound quick action: ${buttonId}`);
        }
      });
    }

    // Try to bind immediately if DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bindQuickActions);
    } else {
      bindQuickActions();
    }

    // Also try again after a short delay to catch late-loaded elements
    setTimeout(bindQuickActions, 100);
    setTimeout(bindQuickActions, 500);
  } catch (error) {
    console.error("Error setting up dashboard quick actions:", error);
  }
})();
