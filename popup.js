async function getCookieHeader() {
  const cookies = await chrome.cookies.getAll({ domain: "leetcode.com" });
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

async function fetchAllAcceptedProblems() {
  let offset = 40;
  const limit = 20;
  let lastKey = "";
  let hasNext = true;
  const accepted = new Map();

  const cookieHeader = await getCookieHeader();

  while (hasNext) {
    const url = `https://leetcode.com/api/submissions/?offset=${offset}&limit=${limit}&lastkey=${lastKey}`;

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
        Referer: "https://leetcode.com/submissions/",
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    const data = await res.json();

    for (const sub of data.submissions_dump || []) {
      if (sub.status_display === "Accepted" && !accepted.has(sub.title_slug)) {
        accepted.set(sub.title_slug, {
          title: sub.title,
          titleSlug: sub.title_slug,
          lang: sub.lang,
          timestamp: sub.timestamp,
        });
      }
    }

    hasNext = data.has_next;
    lastKey = data.last_key || "";
    offset += limit;
  }

  return [...accepted.values()];
}

function downloadJSON(data, filename = "solved_problems.json") {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  a.style.display = "none";

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.getElementById("fetchBtn").addEventListener("click", async () => {
  const output = document.getElementById("output");
  output.textContent = "Fetching your accepted problems...";

  try {
    const solved = await fetchAllAcceptedProblems();
    downloadJSON(solved, "devpalwar_solved_problems.json");

    output.textContent = `✅ Downloaded ${solved.length} accepted problems as JSON.`;
  } catch (err) {
    output.textContent = `❌ Error: ${err.message}`;
  }
});
