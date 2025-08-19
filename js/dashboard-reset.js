// Optional: Reset local data if ?reset=1 is present in the URL
(function () {
  try {
    const params = new URLSearchParams(window.location.search);
    const shouldReset = params.get("reset") === "1";
    if (!shouldReset) return;

    // Preserve login data
    const userRole = localStorage.getItem("userRole");
    const userEmail = localStorage.getItem("userEmail");
    const shuttlestatsUser = localStorage.getItem("shuttlestats-user");

    console.log("Reset flag detected. Clearing ShuttleStats data...");

    // Clear user-scoped keys based on current user (fallback to demo)
    const email = userEmail || "practice@gmail.com";
    const keysToRemove = [
      `trainingSessions_${email}`,
      `matches_${email}`,
      `goals_${email}`,
      "shuttleStats_sessions",
      "shuttleStats_reminderSettings",
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // Restore login data
    if (userRole) localStorage.setItem("userRole", userRole);
    if (userEmail) localStorage.setItem("userEmail", userEmail);
    if (shuttlestatsUser)
      localStorage.setItem("shuttlestats-user", shuttlestatsUser);

    console.log("Data reset complete.");
  } catch (_) {}
})();
