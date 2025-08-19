// Goals Management System
// Integrates with existing ShuttleStats architecture

class GoalsManager {
  constructor(dataService, authService) {
    this.dataService = dataService;
    this.authService = authService;
    this.goals = [];
    this.currentFilter = "all";
    this.currentSort = "newest";
    this.editingGoal = null;

    this.init();
  }

  async init() {
    console.log("Initializing Goals Manager...");

    // Load existing goals
    await this.loadGoals();

    // Setup event listeners
    this.setupEventListeners();

    // Initial render
    this.renderGoals();
    this.updateStats();

    console.log("Goals Manager initialized successfully");
  }

  async loadGoals() {
    console.log("loadGoals method called");
    console.log("dataService:", this.dataService);
    console.log("authService:", this.authService);

    try {
      if (this.dataService && typeof this.dataService.getGoals === "function") {
        console.log("Using Firebase dataService to load goals");
        this.goals = (await this.dataService.getGoals()) || [];
        console.log(
          `Loaded ${this.goals.length} goals from Firebase:`,
          this.goals
        );
      } else {
        console.log("Using localStorage fallback to load goals");
        // Fallback to localStorage
        const userEmail =
          localStorage.getItem("userEmail") || "practice@gmail.com";
        console.log("User email:", userEmail);
        const savedGoals = localStorage.getItem(`goals_${userEmail}`);
        console.log("Raw saved goals:", savedGoals);
        this.goals = savedGoals ? JSON.parse(savedGoals) : [];
        console.log(
          `Loaded ${this.goals.length} goals from localStorage:`,
          this.goals
        );
      }
    } catch (error) {
      console.error("Error loading goals:", error);
      MessageSystem.showMessage("Failed to load goals", "error");
      this.goals = [];
    }
  }

  async saveGoals() {
    try {
      if (this.dataService && typeof this.dataService.saveGoal === "function") {
        // Firebase saves individual goals, so we don't need to save the array
        console.log("Goals managed by Firebase");
      } else {
        // Fallback to localStorage
        const userEmail =
          localStorage.getItem("userEmail") || "practice@gmail.com";
        localStorage.setItem(`goals_${userEmail}`, JSON.stringify(this.goals));
        console.log("Goals saved to localStorage");
      }
    } catch (error) {
      console.error("Error saving goals:", error);
      MessageSystem.showMessage("Failed to save goals", "error");
    }
  }

  setupEventListeners() {
    console.log("Setting up goals event listeners...");

    // New goal button - wait for it to be available
    const setupNewGoalButton = () => {
      const newGoalBtn = document.getElementById("newGoalBtn");
      if (newGoalBtn) {
        newGoalBtn.addEventListener("click", (e) => {
          console.log("New goal button clicked!", e);
          e.preventDefault();
          try {
            this.showGoalForm();
          } catch (error) {
            console.error("Error in showGoalForm:", error);
          }
        });
        console.log("New goal button listener added successfully");
        return true;
      } else {
        console.error("newGoalBtn element not found!");
        return false;
      }
    };

    // Try to setup the button, if it fails, wait and try again
    if (!setupNewGoalButton()) {
      setTimeout(() => {
        setupNewGoalButton();
      }, 100);
    }

    // Close form button
    const closeFormBtn = document.getElementById("closeFormBtn");
    if (closeFormBtn) {
      closeFormBtn.addEventListener("click", () => {
        this.hideGoalForm();
      });
    }

    // Cancel button
    const cancelBtn = document.getElementById("cancelBtn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.hideGoalForm();
      });
    }

    // Form submission
    const goalFormData = document.getElementById("goalFormData");
    if (goalFormData) {
      goalFormData.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    // Filter tabs
    document.querySelectorAll(".filter-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document
          .querySelectorAll(".filter-tab")
          .forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        this.currentFilter = tab.dataset.filter;
        this.renderGoals();
      });
    });

    // Sort dropdown
    const sortGoals = document.getElementById("sortGoals");
    if (sortGoals) {
      sortGoals.addEventListener("change", (e) => {
        this.currentSort = e.target.value;
        this.renderGoals();
      });
    }

    // Close form on background click
    const goalForm = document.getElementById("goalForm");
    if (goalForm) {
      goalForm.addEventListener("click", (e) => {
        if (e.target.id === "goalForm") {
          this.hideGoalForm();
        }
      });
    }

    // Escape key to close form
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        document.getElementById("goalForm").style.display !== "none"
      ) {
        this.hideGoalForm();
      }
    });
  }

  showGoalForm(goal = null) {
    console.log("showGoalForm called", goal);

    this.editingGoal = goal;
    const form = document.getElementById("goalForm");
    const formTitle = document.getElementById("formTitle");
    const submitText = document.getElementById("submitText");

    if (!form || !formTitle || !submitText) {
      console.error("Goal form elements not found!");
      return;
    }

    if (goal) {
      // Edit mode
      formTitle.textContent = "Edit Goal";
      submitText.textContent = "Update Goal";
      this.populateForm(goal);
    } else {
      // Create mode
      formTitle.textContent = "Add New Goal";
      submitText.textContent = "Create Goal";
      this.resetForm();
    }

    try {
      // Use simple animation instead of FormAnimations
      console.log("Showing form with simple animation");
      form.style.display = "flex";
      form.style.opacity = "0";
      form.style.transform = "scale(0.95)";

      // Trigger animation after display is set
      setTimeout(() => {
        form.style.transition = "all 0.3s ease";
        form.style.opacity = "1";
        form.style.transform = "scale(1)";
      }, 10);
    } catch (error) {
      console.error("Error showing goal form:", error);
      // Fallback to simple display
      form.style.display = "flex";
    }
  }

  hideGoalForm(immediate = false) {
    console.log("hideGoalForm called", { immediate });
    const form = document.getElementById("goalForm");

    if (!form) {
      console.error("Goal form element not found!");
      return;
    }

    if (immediate) {
      // Hide instantly without animation
      form.style.display = "none";
      form.style.opacity = "";
      form.style.transform = "";
      form.style.transition = "";
      this.editingGoal = null;
      this.resetForm();
      console.log("Form hidden immediately");
      return;
    }

    try {
      // Use simple animation instead of FormAnimations
      console.log("Hiding form with simple animation");
      form.style.transition = "all 0.3s ease";
      form.style.opacity = "0";
      form.style.transform = "scale(0.95)";

      setTimeout(() => {
        form.style.display = "none";
        // Reset styles for next time
        form.style.opacity = "";
        form.style.transform = "";
        form.style.transition = "";
        console.log("Form hidden successfully");
      }, 300);
    } catch (error) {
      console.error("Error hiding goal form:", error);
      // Fallback to immediate hide
      form.style.display = "none";
    }

    this.editingGoal = null;
    this.resetForm();
    console.log("hideGoalForm completed");
  }

  resetForm() {
    document.getElementById("goalFormData").reset();
    // Set default deadline to 30 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    document.getElementById("goalDeadline").value = defaultDate
      .toISOString()
      .split("T")[0];
  }

  populateForm(goal) {
    document.getElementById("goalTitle").value = goal.title || "";
    document.getElementById("goalDescription").value = goal.description || "";
    document.getElementById("goalCategory").value = goal.category || "training";
    document.getElementById("goalPriority").value = goal.priority || "medium";
    document.getElementById("goalTarget").value = goal.target || "";
    document.getElementById("goalUnit").value = goal.unit || "sessions";
    document.getElementById("goalDeadline").value = goal.deadline
      ? goal.deadline.split("T")[0]
      : "";
  }

  async handleFormSubmit() {
    console.log("handleFormSubmit called");

    try {
      const formData = new FormData(document.getElementById("goalFormData"));
      console.log("Form data created");

      const goalData = {
        title: document.getElementById("goalTitle").value.trim(),
        description: document.getElementById("goalDescription").value.trim(),
        category: document.getElementById("goalCategory").value,
        priority: document.getElementById("goalPriority").value,
        target: parseInt(document.getElementById("goalTarget").value) || null,
        unit: document.getElementById("goalUnit").value,
        deadline: document.getElementById("goalDeadline").value || null,
        current: 0,
        completed: false,
        createdAt: this.editingGoal
          ? this.editingGoal.createdAt
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("Goal data prepared:", goalData);

      // Validation
      if (!goalData.title) {
        console.log("Validation failed: no title");
        MessageSystem.showMessage("Goal title is required", "error");
        return;
      }

      console.log("Validation passed");

      // Optimistically close the form immediately to guarantee auto-exit UX
      // even if subsequent async operations are slow.
      this.hideGoalForm(true);
      // Show loading on the goals list while we save and refresh
      this.setGoalsLoading(true);

      if (this.editingGoal) {
        console.log("Updating existing goal");
        // Update existing goal
        goalData.id = this.editingGoal.id;
        goalData.current = this.editingGoal.current;
        goalData.completed = this.editingGoal.completed;

        if (
          this.dataService &&
          typeof this.dataService.updateGoal === "function"
        ) {
          try {
            await this.withTimeout(
              this.dataService.updateGoal(goalData.id, goalData),
              8000
            );
          } catch (e) {
            if (e?.name === "TimeoutError") {
              MessageSystem.showMessage(
                "Network is slow. Changes will sync in the background.",
                "info"
              );
            } else {
              throw e;
            }
          }
        }

        const index = this.goals.findIndex((g) => g.id === goalData.id);
        if (index !== -1) {
          this.goals[index] = goalData;
        }

        MessageSystem.showMessage("Goal updated successfully!", "success");
      } else {
        // Create new goal
        if (
          this.dataService &&
          typeof this.dataService.saveGoal === "function"
        ) {
          console.log("Saving goal to Firebase");
          let saved = null;
          try {
            saved = await this.withTimeout(
              this.dataService.saveGoal(goalData),
              8000
            );
          } catch (e) {
            if (e?.name === "TimeoutError") {
              MessageSystem.showMessage(
                "Network is slow. Your goal will appear once synced.",
                "info"
              );
            } else {
              throw e;
            }
          }
          // Prefer Firestore-generated ID to keep future updates/deletes consistent
          if (saved && saved.id) {
            goalData.id = saved.id;
          } else if (!goalData.id) {
            // Fallback local ID if something unexpected happens
            goalData.id =
              "goal_" +
              Date.now() +
              "_" +
              Math.random().toString(36).substr(2, 9);
          }
        } else {
          // Local storage fallback: generate a client ID
          goalData.id =
            "goal_" +
            Date.now() +
            "_" +
            Math.random().toString(36).substr(2, 9);
        }

        this.goals.push(goalData);
        console.log("Goal added to local array");
        MessageSystem.showMessage("Goal created successfully!", "success");
      }

      console.log("Saving goals...");
      await this.saveGoals();

      console.log("Goal form already hidden after validation");

      // Reload goals from backend to reflect server-side fields/order
      try {
        await this.withTimeout(this.loadGoals(), 8000);
      } catch (e) {
        if (e?.name === "TimeoutError") {
          // Keep local list and inform user
          MessageSystem.showMessage(
            "Still syncing… showing local data for now.",
            "info"
          );
        } else {
          throw e;
        }
      }

      console.log("Rendering goals...");
      this.renderGoals();

      console.log("Updating stats...");
      this.updateStats();

      console.log("Goal creation process completed successfully");
    } catch (error) {
      console.error("Error saving goal:", error);
      MessageSystem.showMessage(
        "Failed to save goal. Please try again.",
        "error"
      );
    } finally {
      // Always clear loading state
      this.setGoalsLoading(false);
      // Ensure UI refresh happens even if an error occurred earlier
      try {
        this.renderGoals();
        this.updateStats();
      } catch (_) {}
    }
  }

  // Wrap a promise with a timeout to prevent UI hangs
  withTimeout(promise, ms = 8000) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        const err = new Error("Operation timed out");
        err.name = "TimeoutError";
        reject(err);
      }, ms);
    });
    return Promise.race([promise.finally(() => clearTimeout(timer)), timeout]);
  }

  // Show/hide loading state in goals list and mark stats as loading
  setGoalsLoading(isLoading) {
    const goalsList = document.getElementById("goalsList");
    if (isLoading) {
      if (goalsList) {
        goalsList.innerHTML = `
          <div class="loading-state">
            <div class="loading-content">
              <span class="loading-icon">🎯</span>
              <h3>Saving your goal...</h3>
              <p>Fetching updated goals</p>
            </div>
          </div>
        `;
      }
      ["totalGoals", "completedGoals", "activeGoals", "completionRate"].forEach(
        (id) => {
          const el = document.getElementById(id);
          if (el) el.classList.add("loading");
        }
      );
    } else {
      ["totalGoals", "completedGoals", "activeGoals", "completionRate"].forEach(
        (id) => {
          const el = document.getElementById(id);
          if (el) el.classList.remove("loading");
        }
      );
      // If the list still shows the loading placeholder, clear and re-render
      if (goalsList && goalsList.querySelector(".loading-state")) {
        goalsList.innerHTML = "";
        try {
          this.renderGoals();
          this.updateStats();
        } catch (e) {
          // swallow render errors here; they will surface elsewhere if needed
        }
      }
    }
  }

  async toggleGoalComplete(goalId) {
    try {
      const goal = this.goals.find((g) => g.id === goalId);
      if (!goal) return;

      goal.completed = !goal.completed;
      goal.updatedAt = new Date().toISOString();

      if (goal.completed) {
        goal.current = goal.target || goal.current;
      }

      if (
        this.dataService &&
        typeof this.dataService.updateGoal === "function"
      ) {
        await this.dataService.updateGoal(goalId, goal);
      }

      await this.saveGoals();
      this.renderGoals();
      this.updateStats();

      const message = goal.completed
        ? "Goal completed! 🎉"
        : "Goal marked as active";
      MessageSystem.showMessage(message, "success");
    } catch (error) {
      console.error("Error toggling goal completion:", error);
      MessageSystem.showMessage("Failed to update goal", "error");
    }
  }

  async updateGoalProgress(goalId, current) {
    try {
      const goal = this.goals.find((g) => g.id === goalId);
      if (!goal) return;

      goal.current = Math.max(0, current);
      goal.updatedAt = new Date().toISOString();

      // Auto-complete if target reached
      if (goal.target && goal.current >= goal.target) {
        goal.completed = true;
      }

      if (
        this.dataService &&
        typeof this.dataService.updateGoal === "function"
      ) {
        await this.dataService.updateGoal(goalId, goal);
      }

      await this.saveGoals();
      this.renderGoals();
      this.updateStats();

      if (goal.completed) {
        MessageSystem.showMessage(
          "Goal completed automatically! 🎉",
          "success"
        );
      }
    } catch (error) {
      console.error("Error updating goal progress:", error);
      MessageSystem.showMessage("Failed to update progress", "error");
    }
  }

  async deleteGoal(goalId) {
    if (
      !confirm(
        "Are you sure you want to delete this goal? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      if (
        this.dataService &&
        typeof this.dataService.deleteGoal === "function"
      ) {
        await this.dataService.deleteGoal(goalId);
      }

      this.goals = this.goals.filter((g) => g.id !== goalId);
      await this.saveGoals();
      this.renderGoals();
      this.updateStats();

      MessageSystem.showMessage("Goal deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting goal:", error);
      MessageSystem.showMessage("Failed to delete goal", "error");
    }
  }

  getFilteredAndSortedGoals() {
    let filteredGoals = [...this.goals];

    // Apply filter
    if (this.currentFilter !== "all") {
      filteredGoals = filteredGoals.filter((goal) => {
        switch (this.currentFilter) {
          case "active":
            return !goal.completed;
          case "completed":
            return goal.completed;
          case "overdue":
            return (
              !goal.completed &&
              goal.deadline &&
              new Date(goal.deadline) < new Date()
            );
          default:
            return true;
        }
      });
    }

    // Apply sort
    filteredGoals.sort((a, b) => {
      switch (this.currentSort) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "deadline":
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });

    return filteredGoals;
  }

  renderGoals() {
    console.log("renderGoals called");
    console.log("Current goals:", this.goals);

    const goalsList = document.getElementById("goalsList");
    console.log("goalsList element:", goalsList);

    const goals = this.getFilteredAndSortedGoals();
    console.log("Filtered and sorted goals:", goals);

    if (goals.length === 0) {
      console.log("No goals to render, showing empty state");
      this.renderEmptyState();
      return;
    }

    console.log("Rendering", goals.length, "goals");
    goalsList.innerHTML = goals
      .map((goal) => this.createGoalHTML(goal))
      .join("");

    // Add event listeners to goal action buttons
    goals.forEach((goal) => {
      // Complete/uncomplete button
      const completeBtn = document.querySelector(
        `[data-goal-id="${goal.id}"][data-action="complete"]`
      );
      if (completeBtn) {
        completeBtn.addEventListener("click", () =>
          this.toggleGoalComplete(goal.id)
        );
      }

      // Edit button
      const editBtn = document.querySelector(
        `[data-goal-id="${goal.id}"][data-action="edit"]`
      );
      if (editBtn) {
        editBtn.addEventListener("click", () => this.showGoalForm(goal));
      }

      // Delete button
      const deleteBtn = document.querySelector(
        `[data-goal-id="${goal.id}"][data-action="delete"]`
      );
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => this.deleteGoal(goal.id));
      }

      // Progress input
      const progressInput = document.querySelector(
        `[data-goal-id="${goal.id}"][data-action="progress"]`
      );
      if (progressInput) {
        progressInput.addEventListener("change", (e) => {
          this.updateGoalProgress(goal.id, parseInt(e.target.value) || 0);
        });
      }
    });
  }

  renderEmptyState() {
    const goalsList = document.getElementById("goalsList");

    let emptyMessage = "No goals found";
    let emptyDescription =
      "Start by creating your first goal to track your badminton progress!";
    let buttonText = "Create Your First Goal";

    if (this.currentFilter === "active") {
      emptyMessage = "No active goals";
      emptyDescription =
        "All your goals are completed! Create new goals to keep improving.";
    } else if (this.currentFilter === "completed") {
      emptyMessage = "No completed goals yet";
      emptyDescription =
        "Complete some goals to see them here. Keep working towards your targets!";
      buttonText = "View All Goals";
    } else if (this.currentFilter === "overdue") {
      emptyMessage = "No overdue goals";
      emptyDescription =
        "Great job staying on track! All your goals are on schedule.";
      buttonText = "View All Goals";
    }

    EmptyStateRenderer.renderEmptyState("goalsList", {
      icon: "🎯",
      title: emptyMessage,
      message: emptyDescription,
      buttonText: buttonText,
      onButtonClick: () => {
        if (
          this.currentFilter === "completed" ||
          this.currentFilter === "overdue"
        ) {
          // Switch to all goals filter
          document.querySelector('.filter-tab[data-filter="all"]').click();
        } else {
          this.showGoalForm();
        }
      },
    });
  }

  createGoalHTML(goal) {
    const isOverdue =
      !goal.completed && goal.deadline && new Date(goal.deadline) < new Date();
    const progress = goal.target
      ? Math.round((goal.current / goal.target) * 100)
      : 0;
    const categoryIcons = {
      training: "🏃‍♂️",
      matches: "🏆",
      skills: "⚡",
      fitness: "💪",
      other: "📋",
    };

    return `
      <div class="goal-item ${goal.completed ? "completed" : ""} ${
      isOverdue ? "overdue" : ""
    }">
        <div class="goal-header">
          <div class="goal-info">
            <div class="goal-title ${goal.completed ? "completed" : ""}">
              ${goal.completed ? "✅" : "🎯"} ${goal.title}
            </div>
            <div class="goal-category">
              ${categoryIcons[goal.category] || "📋"} ${goal.category}
            </div>
            ${
              goal.description
                ? `<div class="goal-description">${goal.description}</div>`
                : ""
            }
            <div class="goal-meta">
              <div class="goal-priority ${goal.priority}">
                ${
                  goal.priority === "high"
                    ? "🔴"
                    : goal.priority === "medium"
                    ? "🟡"
                    : "🟢"
                } ${goal.priority}
              </div>
              ${
                goal.deadline
                  ? `
                <div class="goal-deadline ${isOverdue ? "overdue" : ""}">
                  📅 ${this.formatDate(goal.deadline)} ${
                      isOverdue ? "(Overdue)" : ""
                    }
                </div>
              `
                  : ""
              }
              <div class="goal-created">
                Created ${this.formatRelativeDate(goal.createdAt)}
              </div>
            </div>
          </div>
          <div class="goal-actions">
            <button class="goal-action-btn complete" 
                    data-goal-id="${goal.id}" 
                    data-action="complete"
                    title="${
                      goal.completed ? "Mark as incomplete" : "Mark as complete"
                    }">
              ${goal.completed ? "↶" : "✓"}
            </button>
            <button class="goal-action-btn edit" 
                    data-goal-id="${goal.id}" 
                    data-action="edit"
                    title="Edit goal">
              ✏️
            </button>
            <button class="goal-action-btn delete" 
                    data-goal-id="${goal.id}" 
                    data-action="delete"
                    title="Delete goal">
              🗑️
            </button>
          </div>
        </div>
        ${
          goal.target
            ? `
          <div class="goal-progress">
            <div class="progress-info">
              <div class="progress-text">
                Progress: 
                <input type="number" 
                       value="${goal.current || 0}" 
                       min="0" 
                       max="${goal.target}"
                       data-goal-id="${goal.id}"
                       data-action="progress"
                       style="width: 60px; margin: 0 4px; text-align: center; border: 1px solid #d1d5db; border-radius: 4px; padding: 2px 4px;"
                       ${goal.completed ? "disabled" : ""}> 
                / ${goal.target} ${goal.unit}
              </div>
              <div class="progress-percentage">${progress}%</div>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar ${goal.completed ? "completed" : ""}" 
                   style="width: ${Math.min(progress, 100)}%"></div>
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  updateStats() {
    console.log("updateStats called");
    console.log("Goals for stats:", this.goals);

    const totalGoals = this.goals.length;
    const completedGoals = this.goals.filter((g) => g.completed).length;
    const activeGoals = totalGoals - completedGoals;
    const completionRate =
      totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    console.log("Stats calculated:", {
      totalGoals,
      completedGoals,
      activeGoals,
      completionRate,
    });

    document.getElementById("totalGoals").textContent = totalGoals;
    document.getElementById("totalGoals").classList.remove("loading");

    document.getElementById("completedGoals").textContent = completedGoals;
    document.getElementById("completedGoals").classList.remove("loading");

    document.getElementById("activeGoals").textContent = activeGoals;
    document.getElementById("activeGoals").classList.remove("loading");

    document.getElementById(
      "completionRate"
    ).textContent = `${completionRate}%`;
    document.getElementById("completionRate").classList.remove("loading");
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  formatRelativeDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "today";
    if (diffDays === 2) return "yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  }

  // Public method to sync with training/match data
  async syncWithActivityData() {
    try {
      // This will be called when training sessions or matches are added
      // to automatically update relevant goals

      const userEmail =
        localStorage.getItem("userEmail") || "practice@gmail.com";

      // Get training sessions count
      const trainingSessions = JSON.parse(
        localStorage.getItem(`trainingSessions_${userEmail}`) || "[]"
      );
      const trainingCount = trainingSessions.length;

      // Get matches count
      const matches = JSON.parse(
        localStorage.getItem(`matches_${userEmail}`) || "[]"
      );
      const matchCount = matches.length;

      // Update training-related goals
      const trainingGoals = this.goals.filter(
        (g) =>
          !g.completed &&
          g.category === "training" &&
          g.unit === "sessions" &&
          g.target
      );

      for (const goal of trainingGoals) {
        if (goal.current < trainingCount) {
          await this.updateGoalProgress(goal.id, trainingCount);
        }
      }

      // Update match-related goals
      const matchGoals = this.goals.filter(
        (g) =>
          !g.completed &&
          g.category === "matches" &&
          g.unit === "matches" &&
          g.target
      );

      for (const goal of matchGoals) {
        if (goal.current < matchCount) {
          await this.updateGoalProgress(goal.id, matchCount);
        }
      }
    } catch (error) {
      console.error("Error syncing goals with activity data:", error);
    }
  }
}

// Make GoalsManager available globally for integration
window.GoalsManager = GoalsManager;
