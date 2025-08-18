// Matches Page JavaScript Functionality

export class MatchManager {
  constructor() {
    this.matches = [];
    this.remote = typeof window !== "undefined" && !!window.dataService;
    this.unsubscribe = null;
    this.errorTypes = {
      netErrors: "Net Errors",
      outErrors: "Out Shots",
      liftErrors: "Lift Errors",
      serviceFaults: "Service Faults",
      doubleFaults: "Double Faults",
    };
    this.winnerTypes = {
      smashWinners: "Smash Winners",
      dropWinners: "Drop Winners",
      serviceAces: "Service Aces",
    };
    this.init();
  }

  init() {
    // Prefer Firestore subscription when available
    if (
      this.remote &&
      window.dataService &&
      typeof window.dataService.subscribeToMatches === "function"
    ) {
      try {
        this.unsubscribe = window.dataService.subscribeToMatches((matches) => {
          this.matches = (matches || []).map((m) => ({
            id: m.id,
            date: m.date,
            type: m.type,
            opponent: m.opponent || "",
            venue: m.venue || "",
            tournament: m.tournament || "",
            duration: m.duration ? parseInt(m.duration) : null,
            scores: m.scores || { yourSets: 0, oppSets: 0, sets: [] },
            result: m.result || "loss",
            errors: m.errors || {},
            winners: m.winners || {},
            ratings: m.ratings || {},
            notes: m.notes || "",
            nextFocus: m.nextFocus || "",
            createdAt: m.createdAt || new Date().toISOString(),
          }));
          this.updateStats();
          this.renderMatches();
          this.updateAnalysis();
        });
      } catch (err) {
        console.error("Failed to subscribe to matches:", err);
        this.remote = false;
        this.loadMatches();
      }
    } else {
      this.loadMatches();
    }
    this.setupEventListeners();
    this.updateStats();
    this.renderMatches();
    this.updateAnalysis();
  }

  setupEventListeners() {
    // Main action buttons
    document
      .getElementById("newMatchBtn")
      .addEventListener("click", () => this.showMatchForm());
    document
      .getElementById("viewHistoryBtn")
      .addEventListener("click", () => this.showHistory());
    document
      .getElementById("analysisBtn")
      .addEventListener("click", () => this.showAnalysis());
    document
      .getElementById("exportDataBtn")
      .addEventListener("click", () => this.exportData());

    // Form handling
    document
      .getElementById("matchRecordForm")
      .addEventListener("submit", (e) => this.saveMatch(e));
    document
      .getElementById("cancelMatchBtn")
      .addEventListener("click", () => this.hideMatchForm());

    // Score inputs for automatic result calculation
    this.setupScoreCalculation();

    // Rating sliders
    this.setupRatingSliders();

    // Filter controls
    document
      .getElementById("filterType")
      .addEventListener("change", () => this.filterMatches());
    document
      .getElementById("filterResult")
      .addEventListener("change", () => this.filterMatches());
    document
      .getElementById("filterPeriod")
      .addEventListener("change", () => this.filterMatches());

    // Global show match form function
    window.showMatchForm = () => this.showMatchForm();
  }

  setupScoreCalculation() {
    const scoreInputs = [
      "yourSet1",
      "oppSet1",
      "yourSet2",
      "oppSet2",
      "yourSet3",
      "oppSet3",
    ];
    scoreInputs.forEach((inputName) => {
      const input = document.querySelector(`input[name="${inputName}"]`);
      if (input) {
        input.addEventListener("input", () => this.calculateMatchResult());
      }
    });
  }

  setupRatingSliders() {
    const ratingInputs = document.querySelectorAll('input[type="range"]');
    ratingInputs.forEach((slider) => {
      slider.addEventListener("input", (e) => {
        const valueSpan = e.target.parentElement.querySelector(".rating-value");
        if (valueSpan) {
          valueSpan.textContent = e.target.value;
        }
      });
    });
  }

  calculateMatchResult() {
    const yourSet1 =
      parseInt(document.querySelector('input[name="yourSet1"]').value) || 0;
    const oppSet1 =
      parseInt(document.querySelector('input[name="oppSet1"]').value) || 0;
    const yourSet2 =
      parseInt(document.querySelector('input[name="yourSet2"]').value) || 0;
    const oppSet2 =
      parseInt(document.querySelector('input[name="oppSet2"]').value) || 0;
    const yourSet3 =
      parseInt(document.querySelector('input[name="yourSet3"]').value) || 0;
    const oppSet3 =
      parseInt(document.querySelector('input[name="oppSet3"]').value) || 0;

    let yourSets = 0;
    let oppSets = 0;

    // Count set wins
    if (yourSet1 > oppSet1 && yourSet1 >= 21) yourSets++;
    else if (oppSet1 > yourSet1 && oppSet1 >= 21) oppSets++;

    if (yourSet2 > oppSet2 && yourSet2 >= 21) yourSets++;
    else if (oppSet2 > yourSet2 && oppSet2 >= 21) oppSets++;

    if (yourSet3 > 0 || oppSet3 > 0) {
      if (yourSet3 > oppSet3 && yourSet3 >= 21) yourSets++;
      else if (oppSet3 > yourSet3 && oppSet3 >= 21) oppSets++;
    }

    const resultElement = document.getElementById("matchResult");

    if (yourSets === 0 && oppSets === 0) {
      resultElement.className = "match-result";
      resultElement.innerHTML =
        '<span class="result-text">Enter scores to see result</span>';
    } else if (yourSets > oppSets) {
      resultElement.className = "match-result win";
      resultElement.innerHTML = `<span class="result-text">🏆 You Won ${yourSets}-${oppSets}!</span>`;
    } else if (oppSets > yourSets) {
      resultElement.className = "match-result loss";
      resultElement.innerHTML = `<span class="result-text">😞 You Lost ${yourSets}-${oppSets}</span>`;
    } else {
      resultElement.className = "match-result";
      resultElement.innerHTML =
        '<span class="result-text">Match in progress...</span>';
    }
  }

  showMatchForm() {
    document.getElementById("matchForm").style.display = "block";
    document.getElementById("matchHistory").style.display = "none";
    document.getElementById("performanceAnalysis").style.display = "none";

    // Add smooth scroll to form
    document.getElementById("matchForm").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    // Add entrance animation
    const matchForm = document.getElementById("matchForm");
    matchForm.style.opacity = "0";
    matchForm.style.transform = "translateY(20px)";

    setTimeout(() => {
      matchForm.style.transition = "all 0.5s ease";
      matchForm.style.opacity = "1";
      matchForm.style.transform = "translateY(0)";
    }, 100);

    const newMatchBtn = document.getElementById("newMatchBtn");
    newMatchBtn.innerHTML = '<span class="btn-icon">⬅️</span> Back to History';
    newMatchBtn.classList.add("btn-back");

    // Remove existing event listener and add new one
    const newBtn = newMatchBtn.cloneNode(true);
    newMatchBtn.parentNode.replaceChild(newBtn, newMatchBtn);
    newBtn.addEventListener("click", () => this.hideMatchForm());
  }

  hideMatchForm() {
    // Add exit animation
    const matchForm = document.getElementById("matchForm");
    matchForm.style.transition = "all 0.3s ease";
    matchForm.style.opacity = "0";
    matchForm.style.transform = "translateY(-20px)";

    setTimeout(() => {
      document.getElementById("matchForm").style.display = "none";
      document.getElementById("matchHistory").style.display = "block";
      document.getElementById("performanceAnalysis").style.display = "none";

      // Reset styles
      matchForm.style.opacity = "";
      matchForm.style.transform = "";
      matchForm.style.transition = "";
    }, 300);

    const newMatchBtn = document.getElementById("newMatchBtn");
    newMatchBtn.innerHTML = '<span class="btn-icon">🏆</span> Record New Match';
    newMatchBtn.classList.remove("btn-back");

    // Remove existing event listener and add new one
    const newBtn = newMatchBtn.cloneNode(true);
    newMatchBtn.parentNode.replaceChild(newBtn, newMatchBtn);
    newBtn.addEventListener("click", () => this.showMatchForm());

    // Reset form with animation
    this.resetFormWithAnimation();
  }

  resetFormWithAnimation() {
    // Animate form sections reset
    const formSections = document.querySelectorAll(".form-section");
    formSections.forEach((section, index) => {
      setTimeout(() => {
        section.style.transition = "transform 0.3s ease, opacity 0.3s ease";
        section.style.transform = "translateX(-10px)";
        section.style.opacity = "0.5";

        setTimeout(() => {
          // Reset form data
          if (index === 0) {
            // First section - reset basic form
            document.getElementById("matchRecordForm").reset();
            document.getElementById("matchDate").value = new Date()
              .toISOString()
              .split("T")[0];
          }

          if (index === formSections.length - 1) {
            // Last section - reset ratings
            document.querySelectorAll(".rating-value").forEach((span) => {
              span.textContent = "5";
            });
            document
              .querySelectorAll('input[type="range"]')
              .forEach((slider) => {
                slider.value = 5;
              });

            // Reset match result
            document.getElementById("matchResult").className = "match-result";
            document.getElementById("matchResult").innerHTML =
              '<span class="result-text">Enter scores to see result</span>';
          }

          // Restore appearance
          section.style.transform = "translateX(0)";
          section.style.opacity = "1";

          setTimeout(() => {
            section.style.transition = "";
          }, 300);
        }, 150);
      }, index * 100);
    });
  }

  showHistory() {
    this.hideMatchForm();
    document.getElementById("performanceAnalysis").style.display = "none";
    document
      .getElementById("matchHistory")
      .scrollIntoView({ behavior: "smooth" });
  }

  showAnalysis() {
    this.hideMatchForm();
    document.getElementById("matchHistory").style.display = "none";
    document.getElementById("performanceAnalysis").style.display = "block";
    this.updateAnalysis();
  }

  saveMatch(e) {
    e.preventDefault();

    // Add loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';
    submitBtn.disabled = true;

    // Add small delay for better UX
    setTimeout(() => {
      this.processSaveMatch(e, submitBtn, originalText);
    }, 500);
  }

  async processSaveMatch(e, submitBtn, originalText) {
    const formData = new FormData(e.target);

    // Get scores
    const yourSet1 = parseInt(formData.get("yourSet1")) || 0;
    const oppSet1 = parseInt(formData.get("oppSet1")) || 0;
    const yourSet2 = parseInt(formData.get("yourSet2")) || 0;
    const oppSet2 = parseInt(formData.get("oppSet2")) || 0;
    const yourSet3 = parseInt(formData.get("yourSet3")) || 0;
    const oppSet3 = parseInt(formData.get("oppSet3")) || 0;

    // Calculate sets won
    let yourSets = 0;
    let oppSets = 0;

    if (yourSet1 > oppSet1 && yourSet1 >= 21) yourSets++;
    else if (oppSet1 > yourSet1 && oppSet1 >= 21) oppSets++;

    if (yourSet2 > oppSet2 && yourSet2 >= 21) yourSets++;
    else if (oppSet2 > yourSet2 && oppSet2 >= 21) oppSets++;

    if (yourSet3 > 0 || oppSet3 > 0) {
      if (yourSet3 > oppSet3 && yourSet3 >= 21) yourSets++;
      else if (oppSet3 > yourSet3 && oppSet3 >= 21) oppSets++;
    }

    if (yourSets === 0 && oppSets === 0) {
      this.showMessage("Please enter valid match scores.", "error");
      this.resetSubmitButton(submitBtn, originalText);
      return;
    }

    const result = yourSets > oppSets ? "win" : "loss";

    const match = {
      id: Date.now().toString(),
      date: formData.get("date"),
      type: formData.get("type"),
      opponent: formData.get("opponent"),
      venue: formData.get("venue"),
      tournament: formData.get("tournament"),
      duration: parseInt(formData.get("duration")) || null,

      // Scores
      scores: {
        yourSets: yourSets,
        oppSets: oppSets,
        sets: [
          { you: yourSet1, opp: oppSet1 },
          { you: yourSet2, opp: oppSet2 },
        ],
      },

      result: result,

      // Error statistics
      errors: {
        netErrors: parseInt(formData.get("netErrors")) || 0,
        outErrors: parseInt(formData.get("outErrors")) || 0,
        liftErrors: parseInt(formData.get("liftErrors")) || 0,
        serviceFaults: parseInt(formData.get("serviceFaults")) || 0,
        doubleFaults: parseInt(formData.get("doubleFaults")) || 0,
      },

      // Winners
      winners: {
        smashWinners: parseInt(formData.get("smashWinners")) || 0,
        dropWinners: parseInt(formData.get("dropWinners")) || 0,
        serviceAces: parseInt(formData.get("serviceAces")) || 0,
      },

      // Performance ratings
      ratings: {
        forehand: parseInt(formData.get("forehandRating")) || 5,
        backhand: parseInt(formData.get("backhandRating")) || 5,
        serving: parseInt(formData.get("servingRating")) || 5,
        footwork: parseInt(formData.get("footworkRating")) || 5,
        strategy: parseInt(formData.get("strategyRating")) || 5,
        mental: parseInt(formData.get("mentalRating")) || 5,
      },

      notes: formData.get("notes"),
      nextFocus: formData.get("nextFocus"),
      createdAt: new Date().toISOString(),
    };

    // Add third set if it was played
    if (yourSet3 > 0 || oppSet3 > 0) {
      match.scores.sets.push({ you: yourSet3, opp: oppSet3 });
    }

    try {
      if (
        this.remote &&
        window.dataService &&
        typeof window.dataService.addMatch === "function"
      ) {
        await window.dataService.addMatch(match);
        // UI will refresh via subscription
      } else {
        this.matches.unshift(match); // Add to beginning of array
        this.saveMatches();
        this.updateStats();
        this.renderMatches();
        this.updateAnalysis();
      }
    } catch (err) {
      console.error("Failed to save match:", err);
      this.showMessage("Failed to save match. Please try again.", "error");
      this.resetSubmitButton(submitBtn, originalText);
      return;
    }

    // Success animation
    submitBtn.innerHTML = "✅ Saved!";
    submitBtn.style.background = "#48bb78";

    setTimeout(() => {
      this.showMessage(
        `Match ${
          result === "win" ? "victory" : "result"
        } recorded successfully! 🏸`,
        "success"
      );
      this.hideMatchForm();
      this.resetSubmitButton(submitBtn, originalText);
    }, 1000);
  }

  resetSubmitButton(submitBtn, originalText) {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    submitBtn.style.background = "";
  }

  loadMatches() {
    const userEmail = localStorage.getItem("userEmail") || "practice@gmail.com";
    const savedMatches = localStorage.getItem(`matches_${userEmail}`);
    this.matches = savedMatches ? JSON.parse(savedMatches) : [];
  }

  saveMatches() {
    const userEmail = localStorage.getItem("userEmail") || "practice@gmail.com";
    localStorage.setItem(`matches_${userEmail}`, JSON.stringify(this.matches));
  }

  updateStats() {
    const totalMatches = this.matches.length;
    const wins = this.matches.filter((match) => match.result === "win").length;
    const losses = this.matches.filter(
      (match) => match.result === "loss"
    ).length;
    const winRate =
      totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    // Calculate current streak
    const currentStreak = this.calculateCurrentStreak();

    document.getElementById("totalWins").textContent = wins;
    document.getElementById("totalLosses").textContent = losses;
    document.getElementById("winRatio").textContent = `${winRate}%`;
    document.getElementById("currentStreak").textContent = currentStreak;
  }

  calculateCurrentStreak() {
    if (this.matches.length === 0) return "0";

    const sortedMatches = this.matches.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    const latestResult = sortedMatches[0].result;

    let streak = 0;
    for (const match of sortedMatches) {
      if (match.result === latestResult) {
        streak++;
      } else {
        break;
      }
    }

    return `${streak}${latestResult === "win" ? "W" : "L"}`;
  }

  renderMatches() {
    const matchesList = document.getElementById("matchesList");

    if (this.matches.length === 0) {
      matchesList.innerHTML = `
        <div class="no-matches">
          <div class="empty-state">
            <span class="empty-icon">🏸</span>
            <h3>No matches recorded yet</h3>
            <p>Start recording your matches to track your progress!</p>
            <button class="btn btn-primary" onclick="showMatchForm()">Record Your First Match</button>
          </div>
        </div>
      `;
      return;
    }

    const matchesHtml = this.matches
      .map((match) => this.renderMatch(match))
      .join("");
    matchesList.innerHTML = matchesHtml;
  }

  renderMatch(match) {
    const date = new Date(match.date);
    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const scoreText = match.scores.sets
      .map((set) => `${set.you}-${set.opp}`)
      .join(", ");
    const totalErrors = Object.values(match.errors).reduce(
      (sum, err) => sum + err,
      0
    );
    const totalWinners = Object.values(match.winners).reduce(
      (sum, win) => sum + win,
      0
    );

    return `
      <div class="match-item ${match.result}" data-match-id="${match.id}">
        <div class="match-icon ${match.result}">
          ${match.result === "win" ? "🏆" : "😞"}
        </div>
        <div class="match-details">
          <div class="match-header">
            <div class="match-title">${
              match.type.charAt(0).toUpperCase() +
              match.type.slice(1).replace("-", " ")
            } vs ${match.opponent}</div>
            <div class="match-date">${formattedDate}</div>
          </div>
          <div class="match-meta">
            <span><strong>Result:</strong> ${
              match.result === "win" ? "Won" : "Lost"
            } ${match.scores.yourSets}-${match.scores.oppSets}</span>
            ${
              match.venue
                ? `<span><strong>Venue:</strong> ${match.venue}</span>`
                : ""
            }
            ${
              match.duration
                ? `<span><strong>Duration:</strong> ${match.duration} min</span>`
                : ""
            }
          </div>
          <div class="match-score ${match.result}">
            Score: ${scoreText}
          </div>
          <div class="match-stats-summary">
            <span>Errors: ${totalErrors}</span>
            <span>Winners: ${totalWinners}</span>
            <span>Avg Rating: ${this.getAverageRating(match.ratings)}/10</span>
          </div>
          ${match.notes ? `<div class="match-notes">${match.notes}</div>` : ""}
        </div>
        <div class="match-actions">
          <button class="action-button" onclick="matchManager.editMatch('${
            match.id
          }')" title="Edit">✏️</button>
          <button class="action-button" onclick="matchManager.deleteMatch('${
            match.id
          }')" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }

  getAverageRating(ratings) {
    const values = Object.values(ratings);
    const average =
      values.reduce((sum, rating) => sum + rating, 0) / values.length;
    return Math.round(average * 10) / 10;
  }

  filterMatches() {
    const typeFilter = document.getElementById("filterType").value;
    const resultFilter = document.getElementById("filterResult").value;
    const periodFilter = document.getElementById("filterPeriod").value;

    let filteredMatches = [...this.matches];

    // Filter by match type
    if (typeFilter) {
      filteredMatches = filteredMatches.filter(
        (match) => match.type === typeFilter
      );
    }

    // Filter by result
    if (resultFilter) {
      filteredMatches = filteredMatches.filter(
        (match) => match.result === resultFilter
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

      filteredMatches = filteredMatches.filter(
        (match) => new Date(match.date) >= cutoffDate
      );
    }

    // Render filtered matches
    const matchesList = document.getElementById("matchesList");
    if (filteredMatches.length === 0) {
      matchesList.innerHTML = `
        <div class="no-matches">
          <div class="empty-state">
            <span class="empty-icon">🔍</span>
            <h3>No matches found</h3>
            <p>Try adjusting your filters or record more matches.</p>
          </div>
        </div>
      `;
      return;
    }

    const matchesHtml = filteredMatches
      .map((match) => this.renderMatch(match))
      .join("");
    matchesList.innerHTML = matchesHtml;
  }

  updateAnalysis() {
    if (this.matches.length === 0) {
      this.showEmptyAnalysis();
      return;
    }

    this.analyzeStrengths();
    this.analyzeWeaknesses();
    this.analyzeErrors();
    this.generateRecommendations();
  }

  showEmptyAnalysis() {
    document.getElementById("strengthsAnalysis").innerHTML =
      "<p>Record more matches to see your strengths!</p>";
    document.getElementById("weaknessesAnalysis").innerHTML =
      "<p>Record more matches to identify areas for improvement!</p>";
    document.getElementById("errorAnalysis").innerHTML =
      "<p>Error statistics will appear after recording matches!</p>";
    document.getElementById("recommendationsAnalysis").innerHTML =
      "<p>AI-powered recommendations coming soon!</p>";
  }

  analyzeStrengths() {
    const avgRatings = this.calculateAverageRatings();
    const strengths = Object.entries(avgRatings)
      .filter(([_, rating]) => rating >= 7)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3);

    const strengthsHtml =
      strengths.length > 0
        ? strengths
            .map(
              ([skill, rating]) =>
                `<div class="strength-item">
          <strong>${
            skill.charAt(0).toUpperCase() + skill.slice(1)
          }:</strong> ${rating}/10
        </div>`
            )
            .join("")
        : "<p>Keep working to develop your strengths!</p>";

    document.getElementById("strengthsAnalysis").innerHTML = strengthsHtml;
  }

  analyzeWeaknesses() {
    const avgRatings = this.calculateAverageRatings();
    const weaknesses = Object.entries(avgRatings)
      .filter(([_, rating]) => rating < 6)
      .sort(([_, a], [__, b]) => a - b)
      .slice(0, 3);

    const weaknessesHtml =
      weaknesses.length > 0
        ? weaknesses
            .map(
              ([skill, rating]) =>
                `<div class="weakness-item">
          <strong>${
            skill.charAt(0).toUpperCase() + skill.slice(1)
          }:</strong> ${rating}/10 - Focus area for improvement
        </div>`
            )
            .join("")
        : "<p>Great job! No significant weaknesses identified.</p>";

    document.getElementById("weaknessesAnalysis").innerHTML = weaknessesHtml;
  }

  analyzeErrors() {
    const errorStats = this.calculateErrorStatistics();
    const topErrors = Object.entries(errorStats)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3);

    const errorsHtml =
      topErrors.length > 0
        ? topErrors
            .map(
              ([error, count]) =>
                `<div class="error-item">
          <strong>${
            this.errorTypes[error] || error
          }:</strong> ${count} total (${(count / this.matches.length).toFixed(
                  1
                )} per match)
        </div>`
            )
            .join("")
        : "<p>No significant error patterns found.</p>";

    document.getElementById("errorAnalysis").innerHTML = errorsHtml;
  }

  calculateAverageRatings() {
    const totals = {};
    const counts = {};

    this.matches.forEach((match) => {
      Object.entries(match.ratings).forEach(([skill, rating]) => {
        totals[skill] = (totals[skill] || 0) + rating;
        counts[skill] = (counts[skill] || 0) + 1;
      });
    });

    const averages = {};
    Object.keys(totals).forEach((skill) => {
      averages[skill] = Math.round((totals[skill] / counts[skill]) * 10) / 10;
    });

    return averages;
  }

  calculateErrorStatistics() {
    const totals = {};

    this.matches.forEach((match) => {
      Object.entries(match.errors).forEach(([error, count]) => {
        totals[error] = (totals[error] || 0) + count;
      });
    });

    return totals;
  }

  generateRecommendations() {
    const recommendations = [];
    const avgRatings = this.calculateAverageRatings();
    const errorStats = this.calculateErrorStatistics();
    const winRate =
      this.matches.filter((m) => m.result === "win").length /
      this.matches.length;

    // Win rate based recommendations
    if (winRate < 0.4) {
      recommendations.push(
        "Focus on consistency and reducing unforced errors to improve your win rate."
      );
    } else if (winRate > 0.7) {
      recommendations.push(
        "Great win rate! Consider playing stronger opponents to continue improving."
      );
    }

    // Skill-based recommendations
    const weakestSkill = Object.entries(avgRatings).reduce((min, curr) =>
      curr[1] < min[1] ? curr : min
    );
    if (weakestSkill[1] < 6) {
      recommendations.push(
        `Your ${weakestSkill[0]} needs attention. Consider focused training in this area.`
      );
    }

    // Error-based recommendations
    const topError = Object.entries(errorStats).reduce(
      (max, curr) => (curr[1] > max[1] ? curr : max),
      ["", 0]
    );
    if (topError[1] > this.matches.length * 2) {
      recommendations.push(
        `Work on reducing ${
          this.errorTypes[topError[0]] || topError[0]
        } - it's your most common error.`
      );
    }

    const recommendationsHtml =
      recommendations.length > 0
        ? recommendations
            .map((rec) => `<div class="recommendation-item">${rec}</div>`)
            .join("")
        : "<p>Keep recording matches for personalized recommendations!</p>";

    document.getElementById("recommendationsAnalysis").innerHTML =
      recommendationsHtml;
  }

  editMatch(matchId) {
    this.showMessage("Edit functionality coming soon!", "info");
  }

  async deleteMatch(matchId) {
    if (!confirm("Are you sure you want to delete this match record?")) {
      return;
    }
    try {
      if (
        this.remote &&
        window.dataService &&
        typeof window.dataService.deleteMatch === "function"
      ) {
        await window.dataService.deleteMatch(matchId);
        // UI via subscription
      } else {
        this.matches = this.matches.filter((match) => match.id !== matchId);
        this.saveMatches();
        this.updateStats();
        this.renderMatches();
        this.updateAnalysis();
      }
      this.showMessage("Match record deleted.", "success");
    } catch (err) {
      console.error("Failed to delete match:", err);
      this.showMessage("Failed to delete. Please try again.", "error");
    }
  }

  exportData() {
    if (this.matches.length === 0) {
      this.showMessage("No match data to export.", "error");
      return;
    }

    const data = this.matches.map((match) => ({
      Date: match.date,
      Type: match.type,
      Opponent: match.opponent,
      Result: match.result,
      Score: match.scores.sets.map((set) => `${set.you}-${set.opp}`).join(", "),
      "Sets Won": match.scores.yourSets,
      "Sets Lost": match.scores.oppSets,
      "Total Errors": Object.values(match.errors).reduce(
        (sum, err) => sum + err,
        0
      ),
      "Total Winners": Object.values(match.winners).reduce(
        (sum, win) => sum + win,
        0
      ),
      "Average Rating": this.getAverageRating(match.ratings),
      Venue: match.venue || "",
      Duration: match.duration ? `${match.duration} minutes` : "",
      Notes: match.notes || "",
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
      `shuttlestats_match_data_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showMessage("Match data exported successfully!", "success");
  }

  showMessage(text, type = "info") {
    const messageContainer = document.getElementById("messageContainer");
    const messageId = Date.now().toString();

    const messageElement = document.createElement("div");
    messageElement.className = `message ${type}`;
    messageElement.id = messageId;
    messageElement.textContent = text;

    messageContainer.appendChild(messageElement);

    // Auto remove after 4 seconds
    setTimeout(() => {
      const element = document.getElementById(messageId);
      if (element) {
        element.remove();
      }
    }, 4000);
  }
}

// Initialize when DOM is loaded (can be suppressed by setting window.shouldAutoInitMatches = false)
document.addEventListener("DOMContentLoaded", () => {
  if (window.shouldAutoInitMatches === false) return;
  // Only initialize if we're on the matches page
  if (document.getElementById("matchRecordForm")) {
    window.matchManager = new MatchManager();
  }
});

// Backwards compatibility: attach to window and export default when used as module
try {
  if (typeof window !== "undefined") {
    window.MatchManager = MatchManager;
  }
} catch (_) {}

export default MatchManager;
