// Schedule Manager for ShuttleStats Badminton Tracking App

export class ScheduleManager {
  constructor() {
    this.sessions = this.loadSessions();
    this.remote = typeof window !== "undefined" && !!window.dataService;
    this.remoteReady = false; // becomes true after first server snapshot
    this.unsubscribe = null;
    this.currentDate = new Date();
    this.currentView = "upcoming"; // Default to upcoming view for better UX
    this.reminderSettings = this.loadReminderSettings();

    this.initialize();
  }

  initialize() {
    // Prefer Firestore subscription when available
    if (
      this.remote &&
      window.dataService &&
      typeof window.dataService.subscribeToScheduleSessions === "function"
    ) {
      try {
        this.unsubscribe = window.dataService.subscribeToScheduleSessions(
          (sessions) => {
            // Mark that remote data is flowing
            this.remoteReady = true;
            this.sessions = (sessions || []).map((s) => ({
              id: s.id,
              title: s.title,
              type: s.type,
              date: s.date,
              time: s.time,
              duration: parseFloat(s.duration) || 60,
              location: s.location || "",
              description: s.description || "",
              opponent: s.opponent || null,
              coach: s.coach || null,
              intensity: s.intensity || "medium",
              isRecurring: !!s.isRecurring,
              reminderEnabled: !!s.reminderEnabled,
              reminderTime: s.reminderTime || "30",
              createdAt: s.createdAt || new Date().toISOString(),
            }));
            // Refresh UI when data changes
            this.renderCalendar();
            this.updateScheduleStats();
            this.renderSessions();
          }
        );
      } catch (err) {
        console.error("Failed to subscribe to schedule sessions:", err);
        this.remote = false;
      }
    }

    this.renderCalendar();
    this.setupEventListeners();
    this.updateScheduleStats();
    this.renderSessions();
    this.loadSettings();

    // Show calendar view by default
    this.showCalendarView();

    // Debug current sessions
    console.log(
      "ScheduleManager initialized with",
      this.sessions.length,
      "sessions:",
      this.sessions
    );

    // Check and send pending reminders
    this.checkReminders();

    // Set up reminder check interval (every hour)
    setInterval(() => this.checkReminders(), 3600000);
  }

  setupEventListeners() {
    // Calendar navigation
    document.getElementById("prevMonth").addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderCalendar();
    });

    document.getElementById("nextMonth").addEventListener("click", () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderCalendar();
    });

    // Today button
    const todayBtn = document.getElementById("todayBtn");
    if (todayBtn) {
      todayBtn.addEventListener("click", () => {
        this.currentDate = new Date();
        this.renderCalendar();
      });
    }

    // View controls
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.currentView = btn.dataset.view;
        this.setActiveView(btn);
        this.renderSessions();
      });
    });

    // Form handling
    document
      .getElementById("sessionScheduleForm")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSessionSubmit();
      });

    // Recurring session checkbox
    document.getElementById("isRecurring").addEventListener("change", (e) => {
      const recurringOptions = document.getElementById("recurringOptions");
      recurringOptions.style.display = e.target.checked ? "block" : "none";
    });

    // Reminder notification checkbox
    document
      .getElementById("enableReminders")
      .addEventListener("change", (e) => {
        const reminderOptions = document.getElementById("reminderOptions");
        reminderOptions.style.display = e.target.checked ? "block" : "none";
      });

    // Modal close handlers
    document.querySelectorAll(".close").forEach((closeBtn) => {
      closeBtn.addEventListener("click", () => {
        this.closeModal(closeBtn.closest(".modal"));
      });
    });

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        this.closeModal(e.target);
      }
    });

    // Add session button
    document.getElementById("newSessionBtn").addEventListener("click", () => {
      this.showSessionForm();
    });

    // Cancel session button
    const cancelSessionBtn = document.getElementById("cancelSessionBtn");
    if (cancelSessionBtn) {
      cancelSessionBtn.addEventListener("click", () => {
        this.showCalendarView();
      });
    }

    // View buttons
    document.getElementById("viewCalendarBtn").addEventListener("click", () => {
      this.showCalendarView();
    });

    document.getElementById("upcomingBtn").addEventListener("click", () => {
      this.showUpcomingView();
    });

    document.getElementById("remindersBtn").addEventListener("click", () => {
      this.showReminderSettings();
    });

    // Settings save button
    const saveSettingsBtn = document.getElementById("saveSettingsBtn");
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener("click", () => {
        this.saveSettings();
      });
    }

    // Calendar integration
    const calendarIntegrationBtn = document.getElementById(
      "calendarIntegration"
    );
    if (calendarIntegrationBtn) {
      calendarIntegrationBtn.addEventListener("click", () => {
        this.handleCalendarIntegration();
      });
    }

    // Delegated listeners for sessions list actions and empty state CTA
    const sessionsList = document.getElementById("sessionsList");
    if (sessionsList) {
      sessionsList.addEventListener("click", (e) =>
        this.onSessionsListClick(e)
      );
    }

    // Delegated listeners inside session details modal
    const detailsModal = document.getElementById("sessionDetailsModal");
    if (detailsModal) {
      detailsModal.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-modal-action]");
        if (btn) {
          const action = btn.getAttribute("data-modal-action");
          const id = btn.getAttribute("data-session-id");
          if (action === "edit" && id) this.editSession(id);
          if (action === "delete" && id) this.deleteSession(id);
          return;
        }
        const viewEl = e.target.closest("[data-view-session-id]");
        if (viewEl) {
          const id = viewEl.getAttribute("data-view-session-id");
          if (id) this.showSessionDetails(id);
        }
      });
    }
  }

  onSessionsListClick(e) {
    // Handle empty-state CTA
    const scheduleBtn = e.target.closest("#scheduleFirstBtn");
    if (scheduleBtn) {
      this.showSessionForm();
      return;
    }

    const actionBtn = e.target.closest("[data-action]");
    if (!actionBtn) return;
    const action = actionBtn.getAttribute("data-action");
    const item = actionBtn.closest(".session-item");
    const id = item ? item.getAttribute("data-session-id") : null;
    if (!id) return;

    if (action === "view") this.showSessionDetails(id);
    if (action === "edit") this.editSession(id);
    if (action === "delete") this.deleteSession(id);
  }

  renderCalendar() {
    console.log("Rendering calendar with", this.sessions.length, "sessions");

    const calendarBody = document.getElementById("calendarBody");
    const currentMonthEl = document.getElementById("currentMonth");

    // Update month display
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    currentMonthEl.textContent = `${
      monthNames[this.currentDate.getMonth()]
    } ${this.currentDate.getFullYear()}`;

    // Clear calendar
    calendarBody.innerHTML = "";

    // Get first day of month and number of days
    const firstDay = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      1
    );
    const lastDay = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      0
    );
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      const dayEl = document.createElement("div");
      dayEl.className = "calendar-day other-month";
      const prevMonthDay = new Date(firstDay);
      prevMonthDay.setDate(prevMonthDay.getDate() - (startingDayOfWeek - i));
      dayEl.innerHTML = `<div class="day-number">${prevMonthDay.getDate()}</div>`;
      calendarBody.appendChild(dayEl);
    }

    // Add days of current month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEl = document.createElement("div");
      dayEl.className = "calendar-day";

      const currentDay = new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth(),
        day
      );

      // Check if today
      if (currentDay.toDateString() === today.toDateString()) {
        dayEl.classList.add("today");
      }

      // Get sessions for this day
      const daySessions = this.getSessionsForDate(currentDay);
      if (daySessions.length > 0) {
        dayEl.classList.add("has-session");
        console.log(
          `Calendar day ${day}: Found ${
            daySessions.length
          } sessions for ${currentDay.getFullYear()}-${String(
            currentDay.getMonth() + 1
          ).padStart(2, "0")}-${String(currentDay.getDate()).padStart(2, "0")}`
        );
      }

      dayEl.innerHTML = `
                <div class="day-number">${day}</div>
                <div class="day-sessions">
                    ${daySessions
                      .slice(0, 3)
                      .map(
                        (session) =>
                          `<div class="session-indicator ${session.type}">${session.title}</div>`
                      )
                      .join("")}
                    ${
                      daySessions.length > 3
                        ? `<div class="session-indicator">+${
                            daySessions.length - 3
                          } more</div>`
                        : ""
                    }
                </div>
            `;

      // Add click handler to show day sessions
      dayEl.addEventListener("click", () => {
        this.showDaySessions(currentDay, daySessions);
      });

      calendarBody.appendChild(dayEl);
    }

    // Add remaining cells for next month
    const totalCells = 42; // 6 rows × 7 days
    const cellsUsed = startingDayOfWeek + daysInMonth;
    const remainingCells = totalCells - cellsUsed;

    for (let i = 1; i <= remainingCells; i++) {
      const dayEl = document.createElement("div");
      dayEl.className = "calendar-day other-month";
      dayEl.innerHTML = `<div class="day-number">${i}</div>`;
      calendarBody.appendChild(dayEl);
    }
  }

  getSessionsForDate(date) {
    // Create a date string in local timezone to avoid UTC conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const sessionsForDate = this.sessions.filter((session) => {
      return session.date === dateStr;
    });

    if (sessionsForDate.length > 0) {
      console.log(
        `Found ${sessionsForDate.length} sessions for ${dateStr}:`,
        sessionsForDate
      );
    }

    return sessionsForDate;
  }

  async handleSessionSubmit() {
    const form = document.getElementById("sessionScheduleForm");
    const formData = new FormData(form);

    // Debug form data
    console.log("Form data collected:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    const sessionData = {
      id: Date.now().toString(),
      title: formData.get("sessionTitle"),
      type: formData.get("sessionType"),
      date: formData.get("sessionDate"),
      time: formData.get("sessionTime"),
      duration: parseFloat(formData.get("duration")) * 60, // Convert hours to minutes
      location: formData.get("location"),
      description: formData.get("description"),
      opponent: formData.get("opponent") || null,
      coach: formData.get("coach") || null,
      intensity: formData.get("intensity") || "medium",
      isRecurring: formData.get("isRecurring") === "on",
      reminderEnabled: formData.get("enableReminders") === "on",
      reminderTime: formData.get("reminderTime") || "30",
      createdAt: new Date().toISOString(),
    };

    console.log("Session data to be saved:", sessionData);

    // Validate required fields
    if (
      !sessionData.title ||
      !sessionData.type ||
      !sessionData.date ||
      !sessionData.time
    ) {
      this.showMessage("Please fill in all required fields.", "error");
      return;
    }

    // Handle recurring sessions
    if (sessionData.isRecurring) {
      const recurringType = formData.get("recurringType");
      const selectedDays = formData.getAll("recurringDays");
      const endDate = formData.get("recurringEnd");

      await this.createRecurringSessions(
        sessionData,
        recurringType,
        selectedDays,
        endDate
      );
    } else {
      await this.addSession(sessionData);
    }

    // Hide session form and show upcoming view to see the new session
    this.showUpcomingView();
    form.reset();
    this.showMessage("Session scheduled successfully!", "success");
  }

  async addSession(sessionData) {
    try {
      if (
        this.remote &&
        window.dataService &&
        typeof window.dataService.addScheduleSession === "function"
      ) {
        await window.dataService.addScheduleSession(sessionData);
        // Optimistically update UI if remote subscription hasn't delivered yet
        if (!this.remoteReady) {
          this.sessions.push(sessionData);
          // Update views immediately
          this.renderCalendar();
          this.renderSessions();
          this.updateScheduleStats();
        }
        // When subscription fires, it will replace this.sessions with server data
      } else {
        this.sessions.push(sessionData);
        this.saveSessions();
        // Update all views immediately
        this.renderCalendar();
        this.renderSessions();
        this.updateScheduleStats();
      }

      // Schedule reminder if enabled
      if (sessionData.reminderEnabled) {
        this.scheduleReminder(sessionData);
      }
    } catch (err) {
      console.error("Failed to add session:", err);
      this.showMessage(
        "Failed to schedule session. Please try again.",
        "error"
      );
    }
  }

  async createRecurringSessions(
    sessionData,
    recurringType,
    selectedDays,
    endDate
  ) {
    const sessions = [];
    const startDate = new Date(sessionData.date);
    const end = new Date(endDate);

    let currentDate = new Date(startDate);

    while (currentDate <= end) {
      if (
        recurringType === "weekly" &&
        selectedDays.includes(currentDate.getDay().toString())
      ) {
        const newSession = {
          ...sessionData,
          id: `${sessionData.id}_${currentDate.getTime()}`,
          date: currentDate.toISOString().split("T")[0],
        };
        sessions.push(newSession);
      } else if (recurringType === "daily") {
        const newSession = {
          ...sessionData,
          id: `${sessionData.id}_${currentDate.getTime()}`,
          date: currentDate.toISOString().split("T")[0],
        };
        sessions.push(newSession);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    for (const session of sessions) {
      await this.addSession(session);
    }
    this.showMessage(
      `${sessions.length} recurring sessions created!`,
      "success"
    );
  }

  renderSessions() {
    const sessionsList = document.getElementById("sessionsList");
    let sessionsToShow = [];

    const now = new Date();

    switch (this.currentView) {
      case "today":
        sessionsToShow = this.sessions.filter((session) => {
          const sessionDate = new Date(session.date);
          return sessionDate.toDateString() === now.toDateString();
        });
        break;
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        sessionsToShow = this.sessions.filter((session) => {
          const sessionDate = new Date(session.date);
          return sessionDate >= weekStart && sessionDate <= weekEnd;
        });
        break;
      case "month":
        sessionsToShow = this.sessions.filter((session) => {
          const sessionDate = new Date(session.date);
          return (
            sessionDate.getMonth() === this.currentDate.getMonth() &&
            sessionDate.getFullYear() === this.currentDate.getFullYear()
          );
        });
        break;
      case "upcoming":
        sessionsToShow = this.sessions
          .filter((session) => {
            const sessionDate = new Date(session.date + "T" + session.time);
            return sessionDate >= now;
          })
          .slice(0, 10);
        break;
    }

    // Sort sessions by date and time
    sessionsToShow.sort((a, b) => {
      const dateA = new Date(a.date + "T" + a.time);
      const dateB = new Date(b.date + "T" + b.time);
      return dateA - dateB;
    });

    if (sessionsToShow.length === 0) {
      sessionsList.innerHTML = `
                <div class="no-sessions">
                    <div class="empty-state">
                        <span class="empty-icon">📅</span>
                        <h3>No sessions found</h3>
                        <p>No sessions scheduled for the selected time period. Click "Add Session" to schedule your first training session!</p>
        <button class="btn btn-primary" id="scheduleFirstBtn">Schedule Session</button>
                    </div>
                </div>
            `;
      return;
    }

    sessionsList.innerHTML = sessionsToShow
      .map((session) => {
        const sessionDate = new Date(session.date);
        const sessionTime = new Date(`${session.date}T${session.time}`);
        const isUpcoming = sessionTime >= now;
        const isPast = sessionTime < now;

        const typeIcons = {
          training: "🏸",
          match: "🥇",
          tournament: "🏆",
          coaching: "👨‍🏫",
          fitness: "💪",
        };

        return `
                <div class="session-item ${
                  isPast ? "past-session" : ""
                }" data-session-id="${session.id}">
                    <div class="session-icon">
                        ${typeIcons[session.type] || "🏸"}
                    </div>
                    <div class="session-details">
                        <div class="session-title">${session.title}</div>
                        <div class="session-time">${this.formatDate(
                          sessionDate
                        )} at ${this.formatTime(session.time)}</div>
                        <div class="session-meta">
                            <span>📍 ${session.location}</span>
                            <span>⏱️ ${session.duration} min</span>
                            ${
                              session.opponent
                                ? `<span>🤝 vs ${session.opponent}</span>`
                                : ""
                            }
                            ${
                              session.coach
                                ? `<span>👨‍🏫 ${session.coach}</span>`
                                : ""
                            }
                            <span>🔥 ${session.intensity}</span>
                        </div>
                    </div>
          <div class="session-actions">
            <button class="session-action" title="View Details" data-action="view">👁️</button>
            <button class="session-action" title="Edit Session" data-action="edit">✏️</button>
            <button class="session-action" title="Delete Session" data-action="delete">🗑️</button>
                        ${
                          isUpcoming && session.reminderEnabled
                            ? `<button class="session-action" title="Reminder Set" style="background: #10b981; color: white;">🔔</button>`
                            : ""
                        }
                    </div>
                </div>
            `;
      })
      .join("");
  }

  showSessionDetails(sessionId) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const modal = document.getElementById("sessionDetailsModal");
    const content = modal.querySelector(".session-details");

    const sessionDate = new Date(session.date);
    const typeIcons = {
      training: "🏸 Training Session",
      match: "🥇 Match",
      tournament: "🏆 Tournament",
      coaching: "👨‍🏫 Coaching Session",
      fitness: "💪 Fitness Training",
    };

    content.innerHTML = `
            <h2>${session.title}</h2>
            <div class="session-info">
                <div class="info-item">
                    <span class="info-label">Type:</span>
                    <span class="info-value">${typeIcons[session.type]}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Date & Time:</span>
                    <span class="info-value">${this.formatDate(
                      sessionDate
                    )} at ${this.formatTime(session.time)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Duration:</span>
                    <span class="info-value">${session.duration} minutes</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Location:</span>
                    <span class="info-value">${session.location}</span>
                </div>
                ${
                  session.opponent
                    ? `
                <div class="info-item">
                    <span class="info-label">Opponent:</span>
                    <span class="info-value">${session.opponent}</span>
                </div>
                `
                    : ""
                }
                ${
                  session.coach
                    ? `
                <div class="info-item">
                    <span class="info-label">Coach:</span>
                    <span class="info-value">${session.coach}</span>
                </div>
                `
                    : ""
                }
                <div class="info-item">
                    <span class="info-label">Intensity:</span>
                    <span class="info-value">${session.intensity.toUpperCase()}</span>
                </div>
                ${
                  session.description
                    ? `
                <div class="info-item">
                    <span class="info-label">Description:</span>
                    <span class="info-value">${session.description}</span>
                </div>
                `
                    : ""
                }
                <div class="info-item">
                    <span class="info-label">Reminders:</span>
                    <span class="info-value">${
                      session.reminderEnabled
                        ? `Enabled (${session.reminderTime} min before)`
                        : "Disabled"
                    }</span>
                </div>
            </div>
            <div class="session-actions">
                <button class="btn btn-secondary" data-modal-action="edit" data-session-id="${
                  session.id
                }">Edit</button>
                <button class="btn btn-danger" data-modal-action="delete" data-session-id="${
                  session.id
                }">Delete</button>
            </div>
        `;

    this.showModal("sessionDetailsModal");
  }

  editSession(sessionId) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    // Populate form with session data
    const form = document.getElementById("sessionScheduleForm");
    form.sessionTitle.value = session.title;
    form.sessionType.value = session.type;
    form.sessionDate.value = session.date;
    form.sessionTime.value = session.time;
    // Duration select expects hours (e.g., 0.5, 1, 1.5), session stores minutes
    const durationHours = (parseFloat(session.duration) || 60) / 60;
    form.duration.value = String(durationHours);
    form.location.value = session.location;
    form.description.value = session.description || "";
    form.opponent.value = session.opponent || "";
    form.coach.value = session.coach || "";
    form.intensity.value = session.intensity;
    form.isRecurring.checked = session.isRecurring;
    form.enableReminders.checked = session.reminderEnabled;
    form.reminderTime.value = session.reminderTime || "30";

    // Show recurring options if needed
    const recurringOptions = document.getElementById("recurringOptions");
    recurringOptions.style.display = session.isRecurring ? "block" : "none";

    // Show reminder options if needed
    const reminderOptions = document.getElementById("reminderOptions");
    reminderOptions.style.display = session.reminderEnabled ? "block" : "none";

    // Store editing session ID
    form.dataset.editingId = sessionId;

    this.showModal("sessionModal");
  }

  async deleteSession(sessionId) {
    if (!confirm("Are you sure you want to delete this session?")) return;
    try {
      if (
        this.remote &&
        window.dataService &&
        typeof window.dataService.deleteScheduleSession === "function"
      ) {
        await window.dataService.deleteScheduleSession(sessionId);
        // UI via subscription
      } else {
        this.sessions = this.sessions.filter((s) => s.id !== sessionId);
        this.saveSessions();
        this.renderCalendar();
        this.renderSessions();
        this.updateScheduleStats();
      }
      this.showMessage("Session deleted successfully!", "success");
    } catch (err) {
      console.error("Failed to delete session:", err);
      this.showMessage("Failed to delete session.", "error");
    }
  }

  updateScheduleStats() {
    const now = new Date();
    const today = now.toDateString();
    const thisWeek = this.getWeekRange(now);
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Total sessions
    const totalSessions = this.sessions.length;

    // This week's upcoming sessions
    const weekUpcomingSessions = this.sessions.filter((session) => {
      const sessionDate = new Date(session.date);
      const sessionTime = new Date(session.date + "T" + session.time);
      return (
        sessionDate >= thisWeek.start &&
        sessionDate <= thisWeek.end &&
        sessionTime >= now
      );
    }).length;

    // Completed sessions (past sessions)
    const completedSessions = this.sessions.filter((session) => {
      const sessionTime = new Date(session.date + "T" + session.time);
      return sessionTime < now;
    }).length;

    // Upcoming sessions
    const upcomingSessions = this.sessions.filter((session) => {
      const sessionTime = new Date(session.date + "T" + session.time);
      return sessionTime >= now;
    }).length;

    // Calculate consistency rate (completed vs total scheduled for past dates)
    const pastSessions = this.sessions.filter((session) => {
      const sessionTime = new Date(session.date + "T" + session.time);
      return sessionTime < now;
    }).length;
    const consistencyRate =
      pastSessions > 0
        ? Math.round((completedSessions / pastSessions) * 100)
        : 0;

    // Update DOM
    const totalSessionsEl = document.getElementById("totalSessions");
    if (totalSessionsEl) totalSessionsEl.textContent = totalSessions;

    const upcomingSessionsEl = document.getElementById("upcomingSessions");
    if (upcomingSessionsEl)
      upcomingSessionsEl.textContent = weekUpcomingSessions;

    const completedSessionsEl = document.getElementById("completedSessions");
    if (completedSessionsEl)
      completedSessionsEl.textContent = completedSessions;

    const consistencyRateEl = document.getElementById("consistencyRate");
    if (consistencyRateEl)
      consistencyRateEl.textContent = consistencyRate + "%";
  }

  getWeekRange(date) {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  scheduleReminder(session) {
    // In a real app, this would integrate with system notifications or email service
    const reminderTime = new Date(session.date + "T" + session.time);
    reminderTime.setMinutes(
      reminderTime.getMinutes() - parseInt(session.reminderTime)
    );

    const now = new Date();
    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    if (timeUntilReminder > 0 && timeUntilReminder <= 24 * 60 * 60 * 1000) {
      // Within 24 hours
      setTimeout(() => {
        this.sendReminder(session);
      }, timeUntilReminder);
    }
  }

  sendReminder(session) {
    // Show browser notification if supported
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`🏸 Upcoming Session: ${session.title}`, {
        body: `${session.type.toUpperCase()} at ${session.location} in ${
          session.reminderTime
        } minutes`,
        icon: "/favicon.ico",
      });
    }

    // Show in-app notification
    this.showMessage(
      `⏰ Reminder: ${session.title} starts in ${session.reminderTime} minutes at ${session.location}`,
      "info"
    );
  }

  checkReminders() {
    const now = new Date();

    this.sessions.forEach((session) => {
      if (!session.reminderEnabled) return;

      const sessionTime = new Date(session.date + "T" + session.time);
      const reminderTime = new Date(sessionTime);
      reminderTime.setMinutes(
        reminderTime.getMinutes() - parseInt(session.reminderTime)
      );

      const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());

      // If reminder time is within 5 minutes of now, send reminder
      if (timeDiff <= 5 * 60 * 1000 && sessionTime > now) {
        this.sendReminder(session);
      }
    });
  }

  handleCalendarIntegration() {
    // Generate calendar data
    const calendarData = this.generateCalendarData();

    // Create and download .ics file
    const blob = new Blob([calendarData], {
      type: "text/calendar;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "shuttlestats-schedule.ics";
    link.click();

    this.showMessage(
      "Calendar file downloaded! Import it to your calendar app.",
      "success"
    );
  }

  generateCalendarData() {
    const now = new Date();
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    let icsData = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ShuttleStats//Badminton Schedule//EN",
      "CALSCALE:GREGORIAN",
    ];

    this.sessions.forEach((session) => {
      const sessionDate = new Date(session.date + "T" + session.time);
      const endDate = new Date(sessionDate);
      endDate.setMinutes(endDate.getMinutes() + session.duration);

      icsData.push(
        "BEGIN:VEVENT",
        `UID:${session.id}@shuttlestats.com`,
        `DTSTAMP:${formatDate(now)}`,
        `DTSTART:${formatDate(sessionDate)}`,
        `DTEND:${formatDate(endDate)}`,
        `SUMMARY:${session.title}`,
        `DESCRIPTION:${
          session.description || `${session.type.toUpperCase()} session`
        }`,
        `LOCATION:${session.location}`,
        session.reminderEnabled
          ? `BEGIN:VALARM
TRIGGER:-PT${session.reminderTime}M
ACTION:DISPLAY
DESCRIPTION:Reminder: ${session.title}
END:VALARM`
          : "",
        "END:VEVENT"
      );
    });

    icsData.push("END:VCALENDAR");
    return icsData.join("\r\n");
  }

  showDaySessions(date, sessions) {
    if (sessions.length === 0) {
      this.showMessage("No sessions scheduled for this day.", "info");
      return;
    }

    const modal = document.getElementById("sessionDetailsModal");
    const content = modal.querySelector(".session-details");

    content.innerHTML = `
            <h2>Sessions for ${this.formatDate(date)}</h2>
            <div class="session-info">
                ${sessions
                  .map(
                    (session) => `
                    <div class="info-item" style="cursor: pointer;" data-view-session-id="${
                      session.id
                    }">
                        <span class="info-label">${this.formatTime(
                          session.time
                        )}:</span>
                        <span class="info-value">${session.title} (${
                      session.type
                    })</span>
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;

    this.showModal("sessionDetailsModal");
  }

  setActiveView(activeBtn) {
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    activeBtn.classList.add("active");
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  closeModal(modal) {
    modal.style.display = "none";
    document.body.style.overflow = "auto";

    // Reset form if it's the session modal
    if (modal.id === "sessionModal") {
      const form = document.getElementById("sessionScheduleForm");
      form.reset();
      delete form.dataset.editingId;
      document.getElementById("recurringOptions").style.display = "none";
      document.getElementById("reminderOptions").style.display = "none";
    }
  }

  showMessage(message, type = "info") {
    const messageContainer =
      document.getElementById("messageContainer") ||
      this.createMessageContainer();

    const messageEl = document.createElement("div");
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;

    messageContainer.appendChild(messageEl);

    // Remove message after 5 seconds
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 5000);
  }

  createMessageContainer() {
    const container = document.createElement("div");
    container.id = "messageContainer";
    container.className = "message-container";
    document.body.appendChild(container);
    return container;
  }

  loadSettings() {
    const settings = this.loadReminderSettings();

    // Populate settings form elements if they exist
    const defaultEmailReminders = document.getElementById(
      "defaultEmailReminders"
    );
    if (defaultEmailReminders) {
      defaultEmailReminders.checked = settings.defaultEmailReminders !== false;
    }

    const defaultPushReminders = document.getElementById(
      "defaultPushReminders"
    );
    if (defaultPushReminders) {
      defaultPushReminders.checked = settings.defaultPushReminders !== false;
    }

    const consistencyReminders = document.getElementById(
      "consistencyReminders"
    );
    if (consistencyReminders) {
      consistencyReminders.checked = settings.consistencyReminders !== false;
    }

    const consistencyDays = document.getElementById("consistencyDays");
    if (consistencyDays) {
      consistencyDays.value = settings.consistencyDays || "5";
    }

    const emailAddress = document.getElementById("emailAddress");
    if (emailAddress) {
      emailAddress.value = settings.emailAddress || "";
    }
  }

  saveSettings() {
    const settings = {
      defaultEmailReminders:
        document.getElementById("defaultEmailReminders")?.checked || false,
      defaultPushReminders:
        document.getElementById("defaultPushReminders")?.checked || false,
      consistencyReminders:
        document.getElementById("consistencyReminders")?.checked || false,
      consistencyDays: document.getElementById("consistencyDays")?.value || "5",
      emailAddress: document.getElementById("emailAddress")?.value || "",
      defaultReminderTime: "30",
      autoReminders: true,
      weekStartDay: "0",
      defaultDuration: "60",
      timeFormat: "24",
    };

    this.reminderSettings = settings;
    localStorage.setItem(
      "shuttleStats_reminderSettings",
      JSON.stringify(settings)
    );

    this.showMessage("Settings saved successfully!", "success");
  }

  // Utility methods
  formatDate(date) {
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  }

  formatTime(time) {
    const settings = this.loadReminderSettings();
    const timeFormat = settings.timeFormat || "24";

    if (timeFormat === "12") {
      const [hours, minutes] = time.split(":");
      const hour12 = hours % 12 || 12;
      const ampm = hours >= 12 ? "PM" : "AM";
      return `${hour12}:${minutes} ${ampm}`;
    }

    return time;
  }

  // View Management Methods
  showSessionForm() {
    // Hide all views
    this.hideAllViews();

    // Show session form
    const sessionForm = document.getElementById("sessionForm");
    if (sessionForm) {
      sessionForm.style.display = "block";
    }

    // Update active button
    this.setActiveButton("newSessionBtn");

    // Reset form
    const form = document.getElementById("sessionScheduleForm");
    if (form) {
      form.reset();
      delete form.dataset.editingId;
    }
  }

  showCalendarView() {
    // Hide all views
    this.hideAllViews();

    // Show calendar view
    const calendarView = document.getElementById("calendarView");
    if (calendarView) {
      calendarView.style.display = "block";
    }

    // Update active button
    this.setActiveButton("viewCalendarBtn");

    // Set view to month for calendar
    this.currentView = "month";

    // Render the calendar and sessions
    this.renderCalendar();
    this.renderSessions();
  }

  showUpcomingView() {
    // Hide all views
    this.hideAllViews();

    // Show upcoming sessions list
    const upcomingView =
      document.getElementById("upcomingView") || this.createUpcomingView();
    upcomingView.style.display = "block";

    // Update active button
    this.setActiveButton("upcomingBtn");

    // Set view to upcoming and render sessions
    this.currentView = "upcoming";
    this.renderSessions();
  }

  showReminderSettings() {
    // Hide all views
    this.hideAllViews();

    // Show reminder settings section
    const reminderSettings = document.getElementById("reminderSettings");
    if (reminderSettings) {
      reminderSettings.style.display = "block";
    }

    // Update active button
    this.setActiveButton("remindersBtn");

    // Load current settings
    this.loadSettings();
  }

  hideAllViews() {
    const views = [
      "calendarView",
      "sessionForm",
      "upcomingView",
      "reminderSettings",
    ];
    views.forEach((viewId) => {
      const view = document.getElementById(viewId);
      if (view) {
        view.style.display = "none";
      }
    });
  }

  setActiveButton(activeId) {
    const buttons = [
      "newSessionBtn",
      "viewCalendarBtn",
      "upcomingBtn",
      "remindersBtn",
    ];
    buttons.forEach((btnId) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.classList.remove("active");
        if (btnId === activeId) {
          btn.classList.add("active");
        }
      }
    });
  }

  createUpcomingView() {
    // Create upcoming view if it doesn't exist
    const contentArea = document.querySelector(".schedule-content");
    if (!contentArea) return null;

    const upcomingView = document.createElement("div");
    upcomingView.id = "upcomingView";
    upcomingView.className = "schedule-section";
    upcomingView.innerHTML = `
      <div class="section-card">
        <div class="section-header">
          <h2>Upcoming Sessions</h2>
          <div class="view-controls">
            <button class="view-btn active" data-view="upcoming">Next 10</button>
            <button class="view-btn" data-view="week">This Week</button>
            <button class="view-btn" data-view="month">This Month</button>
          </div>
        </div>
        <div class="sessions-list" id="sessionsList">
          <!-- Sessions will be rendered here -->
        </div>
      </div>
    `;

    contentArea.appendChild(upcomingView);

    // Setup view control buttons
    upcomingView.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.currentView = btn.dataset.view;
        this.setActiveView(btn);
        this.renderSessions();
      });
    });

    return upcomingView;
  }

  // Storage methods
  loadSessions() {
    const stored = localStorage.getItem("shuttleStats_sessions");
    return stored ? JSON.parse(stored) : [];
  }

  saveSessions() {
    console.log("Saving sessions to localStorage:", this.sessions);
    localStorage.setItem(
      "shuttleStats_sessions",
      JSON.stringify(this.sessions)
    );
    console.log("Sessions saved. Verifying storage...");
    const stored = localStorage.getItem("shuttleStats_sessions");
    console.log("Verification - stored sessions:", JSON.parse(stored || "[]"));
  }

  loadReminderSettings() {
    const stored = localStorage.getItem("shuttleStats_reminderSettings");
    return stored
      ? JSON.parse(stored)
      : {
          defaultReminderTime: "30",
          autoReminders: true,
          weekStartDay: "0",
          defaultDuration: "60",
          timeFormat: "24",
        };
  }
}

// Initialize when DOM is ready (can be suppressed by setting window.shouldAutoInitSchedule = false)
document.addEventListener("DOMContentLoaded", () => {
  if (window.shouldAutoInitSchedule === false) return;
  // Request notification permission
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  // Initialize schedule manager
  window.scheduleManager = new ScheduleManager();
});

// Export for use in other modules
try {
  if (typeof window !== "undefined") {
    window.ScheduleManager = ScheduleManager;
  }
} catch (_) {}

export default ScheduleManager;
