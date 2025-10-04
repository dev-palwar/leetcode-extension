document
  .getElementById("fetchBtn")
  .addEventListener("click", fetchSolvedProblems);

async function fetchSolvedProblems() {
  const fetchBtn = document.getElementById("fetchBtn");
  const loading = document.getElementById("loading");
  const errorDiv = document.getElementById("error");
  const statsDiv = document.getElementById("stats");
  const problemsDiv = document.getElementById("problems");

  // Reset UI
  fetchBtn.disabled = true;
  loading.style.display = "block";
  errorDiv.style.display = "none";
  statsDiv.style.display = "none";
  problemsDiv.innerHTML = "";

  try {
    // Get user's username first
    const profileResponse = await fetch(
      "https://leetcode.com/api/problems/all/",
      {
        credentials: "include",
      }
    );

    if (!profileResponse.ok) {
      throw new Error(
        "Failed to fetch data. Make sure you are logged in to LeetCode."
      );
    }

    const data = await profileResponse.json();

    // Filter solved problems
    const solvedProblems = data.stat_status_pairs.filter(
      (problem) => problem.status === "ac"
    );

    // Display stats
    statsDiv.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Total Solved:</span> ${solvedProblems.length}
      </div>
      <div class="stat-item">
        <span class="stat-label">Total Problems:</span> ${data.stat_status_pairs.length}
      </div>
    `;
    statsDiv.style.display = "block";

    // Display problems
    if (solvedProblems.length === 0) {
      problemsDiv.innerHTML = "<p>No solved problems found.</p>";
    } else {
      // Sort by frontend_question_id
      solvedProblems.sort(
        (a, b) => a.stat.frontend_question_id - b.stat.frontend_question_id
      );

      solvedProblems.forEach((problem) => {
        const problemItem = document.createElement("div");
        problemItem.className = "problem-item";

        const difficulty = getDifficultyText(problem.difficulty.level);
        const difficultyClass = `difficulty-${difficulty.toLowerCase()}`;

        problemItem.innerHTML = `
          <div class="problem-title">
            ${problem.stat.frontend_question_id}. ${
          problem.stat.question__title
        }
          </div>
          <div class="problem-meta">
            <span class="${difficultyClass}">${difficulty}</span> |
            AC Rate: ${(
              (problem.stat.total_acs / problem.stat.total_submitted) *
              100
            ).toFixed(1)}%
          </div>
        `;

        problemsDiv.appendChild(problemItem);
      });
    }

    // Save to storage
    browser.storage.local.set({
      solvedProblems: solvedProblems,
      lastFetched: new Date().toISOString(),
    });
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.style.display = "block";
    console.error("Error:", error);
  } finally {
    loading.style.display = "none";
    fetchBtn.disabled = false;
  }
}

function getDifficultyText(level) {
  switch (level) {
    case 1:
      return "Easy";
    case 2:
      return "Medium";
    case 3:
      return "Hard";
    default:
      return "Unknown";
  }
}

// Load cached data on popup open
window.addEventListener("load", async () => {
  const data = await browser.storage.local.get([
    "solvedProblems",
    "lastFetched",
  ]);

  if (data.solvedProblems && data.solvedProblems.length > 0) {
    const statsDiv = document.getElementById("stats");
    const problemsDiv = document.getElementById("problems");

    statsDiv.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Total Solved:</span> ${
          data.solvedProblems.length
        }
      </div>
      <div class="stat-item">
        <span class="stat-label">Last Updated:</span> ${new Date(
          data.lastFetched
        ).toLocaleString()}
      </div>
    `;
    statsDiv.style.display = "block";

    data.solvedProblems.forEach((problem) => {
      const problemItem = document.createElement("div");
      problemItem.className = "problem-item";

      const difficulty = getDifficultyText(problem.difficulty.level);
      const difficultyClass = `difficulty-${difficulty.toLowerCase()}`;

      problemItem.innerHTML = `
        <div class="problem-title">
          ${problem.stat.frontend_question_id}. ${problem.stat.question__title}
        </div>
        <div class="problem-meta">
          <span class="${difficultyClass}">${difficulty}</span> |
          AC Rate: ${(
            (problem.stat.total_acs / problem.stat.total_submitted) *
            100
          ).toFixed(1)}%
        </div>
      `;

      problemsDiv.appendChild(problemItem);
    });
  }
});
