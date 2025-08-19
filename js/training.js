// Training Page JavaScript Functionality
import { FormAnimations } from "./form-animations.js";
import { DataPersistence } from "./data-persistence.js";
import { MessageSystem } from "./message-system.js";
import { EmptyStateRenderer } from "./empty-state.js";

export class TrainingManager {
  constructor() {
    this.sessions = [];
    this.remote = typeof window !== "undefined" && !!window.dataService;
    this.unsubscribe = null;
    this.focusAreaLabels = {
      footwork: "Footwork Drills",
      backhand: "Backhand Techniques",
      forehand: "Forehand Shots",
      serve: "Serving Practice",
      smash: "Smash Technique",
      defense: "Defensive Play",
      doubles: "Doubles Strategy",
      conditioning: "Physical Conditioning",
    };
    this.init();
  }

  init() {
    // Prefer Firestore subscription when available
    if (
      this.remote &&
      window.dataService &&
      typeof window.dataService.subscribeToTrainingSessions === "function"
    ) {
      try {
        this.unsubscribe = window.dataService.subscribeToTrainingSessions(
          (sessions) => {
            // Ensure data shape parity with local version
            this.sessions = (sessions || []).map((s) => ({
              id: s.id,
              date: s.date,
              duration: parseInt(s.duration) || 0,
              location: s.location || "",
              type: s.type || "individual",
              focusAreas: Array.isArray(s.focusAreas) ? s.focusAreas : [],
              rating: parseInt(s.rating) || 5,
              effort: parseInt(s.effort) || 5,
              notes: s.notes || "",
              nextGoals: s.nextGoals || "",
              createdAt: s.createdAt || new Date().toISOString(),
            }));
            this.updateStats();
            this.renderSessions();
            this.updateInsights();
          }
        );
      } catch (err) {
        console.error("Failed to subscribe to training sessions:", err);
        // Fallback to local if something goes wrong
        this.remote = false;
        this.loadSessions();
      }
    } else {
      this.loadSessions();
    }
    this.setupEventListeners();
    this.updateStats();
    this.renderSessions();
    this.updateInsights();
  }

  setupEventListeners() {
    // Main action buttons
    document
      .getElementById("newSessionBtn")
      .addEventListener("click", () => this.showSessionForm());
    document
      .getElementById("viewHistoryBtn")
      .addEventListener("click", () => this.showHistory());
    document
      .getElementById("exportDataBtn")
      .addEventListener("click", () => this.exportData());

    // Form handling
    document
      .getElementById("trainingSessionForm")
      .addEventListener("submit", (e) => this.saveSession(e));
    document
      .getElementById("cancelSessionBtn")
      .addEventListener("click", () => this.hideSessionForm());

    // Rating sliders
    document.getElementById("overallRating").addEventListener("input", (e) => {
      document.getElementById("ratingValue").textContent = e.target.value;
    });
    document.getElementById("effortLevel").addEventListener("input", (e) => {
      document.getElementById("effortValue").textContent = e.target.value;
    });

    // Filter controls
    document
      .getElementById("filterFocus")
      .addEventListener("change", () => this.filterSessions());
    document
      .getElementById("filterPeriod")
      .addEventListener("change", () => this.filterSessions());

    // Global show session form function
    window.showSessionForm = () => this.showSessionForm();

    // Delegated listeners for session list actions
    const sessionsList = document.getElementById("sessionsList");
    if (sessionsList) {
      sessionsList.addEventListener("click", (e) =>
        this.onSessionsListClick(e)
      );
    }
  }

  onSessionsListClick(e) {
    const target = e.target.closest("[data-action]");
    if (!target) {
      // Handle empty-state CTA
      const firstBtn = e.target.closest("#logFirstSessionBtn");
      if (firstBtn) {
        this.showSessionForm();
      }
      return;
    }

    const action = target.getAttribute("data-action");
    const item = target.closest(".session-item");
    const sessionId = item ? item.getAttribute("data-session-id") : null;

    if (action === "edit" && sessionId) {
      this.editSession(sessionId);
    } else if (action === "delete" && sessionId) {
      this.deleteSession(sessionId);
    }
  }

  showSessionForm() {
    FormAnimations.showForm(
      "sessionForm",
      "trainingHistory",
      "newSessionBtn",
      "⬅️ Back to History"
    );

    // Hide quick stats
    document.getElementById("quickStats").style.display = "none";

    // Update button handler
    FormAnimations.replaceButtonListener("newSessionBtn", () =>
      this.hideSessionForm()
    );
  }

  hideSessionForm() {
    FormAnimations.hideForm(
      "sessionForm",
      "trainingHistory",
      "newSessionBtn",
      "Log New Session",
      "➕"
    );

    // Show quick stats
    document.getElementById("quickStats").style.display = "block";

    // Update button handler and reset form
    FormAnimations.replaceButtonListener("newSessionBtn", () =>
      this.showSessionForm()
    );
    this.resetForm();
  }

  resetForm() {
    document.getElementById("trainingSessionForm").reset();
    document.getElementById("sessionDate").value = new Date()
      .toISOString()
      .split("T")[0];
    document.getElementById("ratingValue").textContent = "5";
    document.getElementById("effortValue").textContent = "5";
  }

  showHistory() {
    this.hideSessionForm();
    document
      .getElementById("trainingHistory")
      .scrollIntoView({ behavior: "smooth" });
  }

  async saveSession(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const focusAreas = Array.from(formData.getAll("focusAreas"));

    if (focusAreas.length === 0) {
      this.showMessage("Please select at least one focus area.", "error");
      return;
    }

    const session = {
      // id will be assigned by Firestore when in remote mode
      id: Date.now().toString(),
      date: formData.get("date"),
      duration: parseInt(formData.get("duration")),
      location: formData.get("location"),
      type: formData.get("type"),
      focusAreas: focusAreas,
      rating: parseInt(formData.get("rating")),
      effort: parseInt(formData.get("effort")),
      notes: formData.get("notes"),
      nextGoals: formData.get("nextGoals"),
      createdAt: new Date().toISOString(),
    };

    try {
      if (
        this.remote &&
        window.dataService &&
        typeof window.dataService.addTrainingSession === "function"
      ) {
        await window.dataService.addTrainingSession(session);
        // UI will refresh via subscription
      } else {
        this.sessions.unshift(session);
        this.saveSessions();
      }

      this.updateStats();
      this.renderSessions();
      this.updateInsights();
      this.showMessage("Training session saved successfully!", "success");
      this.hideSessionForm();
    } catch (err) {
      console.error("Failed to save session:", err);
      this.showMessage("Failed to save session. Please try again.", "error");
    }
  }

  loadSessions() {
    this.sessions = DataPersistence.loadUserData("trainingSessions");
  }

  saveSessions() {
    DataPersistence.saveUserData("trainingSessions", this.sessions);
  }

  updateStats() {
    const totalSessions = this.sessions.length;
    const totalMinutes = this.sessions.reduce(
      (sum, session) => sum + session.duration,
      0
    );
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    // Sessions this week
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    weekStart.setHours(0, 0, 0, 0);
    const thisWeek = this.sessions.filter(
      (session) => new Date(session.date) >= weekStart
    ).length;

    // Average rating
    const avgRating =
      totalSessions > 0
        ? Math.round(
            (this.sessions.reduce((sum, session) => sum + session.rating, 0) /
              totalSessions) *
              10
          ) / 10
        : 0;

    document.getElementById("totalSessions").textContent = totalSessions;
    document.getElementById("totalSessions").classList.remove("loading");

    document.getElementById("totalHours").textContent = totalHours;
    document.getElementById("totalHours").classList.remove("loading");

    document.getElementById("thisWeek").textContent = thisWeek;
    document.getElementById("thisWeek").classList.remove("loading");

    document.getElementById("avgRating").textContent = avgRating;
    document.getElementById("avgRating").classList.remove("loading");
  }

  renderSessions() {
    const sessionsList = document.getElementById("sessionsList");

    if (this.sessions.length === 0) {
      EmptyStateRenderer.renderEmptyState("sessionsList", {
        icon: "🏸",
        title: "No training sessions yet",
        message: "Start logging your training sessions to track your progress!",
        buttonText: "Log Your First Session",
        buttonId: "logFirstSessionBtn",
        onButtonClick: () => this.showSessionForm(),
      });
      return;
    }

    const sessionsHtml = this.sessions
      .map((session) => this.renderSession(session))
      .join("");
    sessionsList.innerHTML = sessionsHtml;
  }

  renderSession(session) {
    const date = new Date(session.date);
    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const focusAreaTags = session.focusAreas
      .map(
        (area) => `<span class="focus-tag">${this.focusAreaLabels[area]}</span>`
      )
      .join("");

    const stars =
      "★".repeat(Math.floor(session.rating / 2)) +
      "☆".repeat(5 - Math.floor(session.rating / 2));

    return `
      <div class="session-item" data-session-id="${session.id}">
        <div class="session-icon">🏃‍♂️</div>
        <div class="session-details">
          <div class="session-header">
            <div class="session-title">${session.type
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase())} Session</div>
            <div class="session-date">${formattedDate}</div>
          </div>
          <div class="session-meta">
            <span><strong>Duration:</strong> ${session.duration} minutes</span>
            ${
              session.location
                ? `<span><strong>Location:</strong> ${session.location}</span>`
                : ""
            }
          </div>
          <div class="session-focus-areas">
            ${focusAreaTags}
          </div>
          <div class="session-rating">
            <span class="rating-stars">${stars}</span>
            <span>${session.rating}/10</span>
          </div>
          ${
            session.notes
              ? `<div class="session-notes">${session.notes}</div>`
              : ""
          }
        </div>
        <div class="session-actions">
          <button class="action-button" data-action="edit" title="Edit">✏️</button>
          <button class="action-button" data-action="delete" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }

  filterSessions() {
    const focusFilter = document.getElementById("filterFocus").value;
    const periodFilter = document.getElementById("filterPeriod").value;

    let filteredSessions = [...this.sessions];

    // Filter by focus area
    if (focusFilter) {
      filteredSessions = filteredSessions.filter((session) =>
        session.focusAreas.includes(focusFilter)
      );
    }

    // Filter by time period
    if (periodFilter !== "all") {
      const now = new Date();
      let cutoffDate;

      switch (periodFilter) {
        case "week":
          cutoffDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "3months":
          cutoffDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
      }

      filteredSessions = filteredSessions.filter(
        (session) => new Date(session.date) >= cutoffDate
      );
    }

    // Render filtered sessions
    const sessionsList = document.getElementById("sessionsList");
    if (filteredSessions.length === 0) {
      EmptyStateRenderer.renderFilteredEmptyState("sessionsList", "filter");
      return;
    }

    const sessionsHtml = filteredSessions
      .map((session) => this.renderSession(session))
      .join("");
    sessionsList.innerHTML = sessionsHtml;
  }

  updateInsights() {
    if (this.sessions.length === 0) {
      document.getElementById("topFocusArea").textContent = "-";
      document.getElementById("avgSessionLength").textContent = "-";
      document.getElementById("trainingStreak").textContent = "0 days";
      document.getElementById("monthlyTotal").textContent = "0 sessions";
      return;
    }

    // Most practiced area
    const focusAreaCounts = {};
    this.sessions.forEach((session) => {
      session.focusAreas.forEach((area) => {
        focusAreaCounts[area] = (focusAreaCounts[area] || 0) + 1;
      });
    });

    const topFocusArea = Object.keys(focusAreaCounts).reduce((a, b) =>
      focusAreaCounts[a] > focusAreaCounts[b] ? a : b
    );
    document.getElementById("topFocusArea").textContent =
      this.focusAreaLabels[topFocusArea] || "-";

    // Average session length
    const avgLength = Math.round(
      this.sessions.reduce((sum, session) => sum + session.duration, 0) /
        this.sessions.length
    );
    document.getElementById(
      "avgSessionLength"
    ).textContent = `${avgLength} min`;

    // Training streak
    const streak = this.calculateStreak();
    document.getElementById("trainingStreak").textContent = `${streak} day${
      streak !== 1 ? "s" : ""
    }`;

    // Monthly total
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyTotal = this.sessions.filter(
      (session) => new Date(session.date) >= monthStart
    ).length;
    document.getElementById(
      "monthlyTotal"
    ).textContent = `${monthlyTotal} session${monthlyTotal !== 1 ? "s" : ""}`;
  }

  calculateStreak() {
    if (this.sessions.length === 0) return 0;

    const sortedDates = [
      ...new Set(this.sessions.map((session) => session.date)),
    ]
      .sort()
      .reverse();
    const today = new Date().toISOString().split("T")[0];

    let streak = 0;
    let currentDate = new Date();

    for (const sessionDate of sortedDates) {
      const dateStr = currentDate.toISOString().split("T")[0];

      if (sessionDate === dateStr) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (sessionDate < dateStr && streak === 0) {
        // No session today, streak is broken
        break;
      } else if (sessionDate < dateStr) {
        // Gap in sessions, streak is broken
        break;
      }
    }

    return streak;
  }

  editSession(sessionId) {
    // For now, just show an alert. Could implement full edit functionality later
    this.showMessage("Edit functionality coming soon!", "info");
  }

  async deleteSession(sessionId) {
    if (!confirm("Are you sure you want to delete this training session?")) {
      return;
    }

    try {
      if (
        this.remote &&
        window.dataService &&
        typeof window.dataService.deleteTrainingSession === "function"
      ) {
        await window.dataService.deleteTrainingSession(sessionId);
        // UI will refresh via subscription
      } else {
        this.sessions = this.sessions.filter(
          (session) => session.id !== sessionId
        );
        this.saveSessions();
        this.updateStats();
        this.renderSessions();
        this.updateInsights();
      }
      this.showMessage("Training session deleted.", "success");
    } catch (err) {
      console.error("Failed to delete session:", err);
      this.showMessage("Failed to delete. Please try again.", "error");
    }
  }

  exportData() {
    if (this.sessions.length === 0) {
      this.showMessage("No training data to export.", "error");
      return;
    }

    const data = this.sessions.map((session) => ({
      Date: session.date,
      Duration: `${session.duration} minutes`,
      Type: session.type,
      Location: session.location || "",
      "Focus Areas": session.focusAreas
        .map((area) => this.focusAreaLabels[area])
        .join(", "),
      "Performance Rating": `${session.rating}/10`,
      "Effort Level": `${session.effort}/10`,
      Notes: session.notes || "",
      "Next Goals": session.nextGoals || "",
    }));

    // Convert to CSV
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header] || "";
            return `"${value.toString().replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `shuttlestats_training_data_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showMessage("Training data exported successfully!", "success");
  }

  showMessage(text, type = "info") {
    MessageSystem.showMessage(text, type);
  }
}

// Initialize when DOM is loaded (can be suppressed by setting window.shouldAutoInitTraining = false)
document.addEventListener("DOMContentLoaded", () => {
  if (window.shouldAutoInitTraining === false) return;
  // Only initialize if we're on the training page
  if (document.getElementById("trainingSessionForm")) {
    window.trainingManager = new TrainingManager();
  }
});

// Backwards compatibility: attach to window and provide default export when used as a module
try {
  if (typeof window !== "undefined") {
    window.TrainingManager = TrainingManager;
  }
} catch (_) {}

export default TrainingManager;
