// Dashboard Quick Actions binding (no inline onclick)
(function () {
  try {
    document.addEventListener("DOMContentLoaded", () => {
      const to = (id) => document.getElementById(id);

      const logTrainingBtn = to("qaLogTraining");
      const recordMatchBtn = to("qaRecordMatch");
      const viewScheduleBtn = to("qaViewSchedule");
      const setGoalBtn = to("qaSetGoal");

      if (logTrainingBtn) {
        logTrainingBtn.addEventListener("click", () => {
          window.location.href = "training.html";
        });
      }

      if (recordMatchBtn) {
        recordMatchBtn.addEventListener("click", () => {
          window.location.href = "matches.html";
        });
      }

      if (viewScheduleBtn) {
        viewScheduleBtn.addEventListener("click", () => {
          window.location.href = "schedule.html";
        });
      }

      if (setGoalBtn) {
        setGoalBtn.addEventListener("click", async () => {
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
          } catch (e) {
            console.error(e);
            alert("Failed to add goal. Try again.");
          }
        });
      }
    });
  } catch (_) {}
})();
