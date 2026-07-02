/* ─────────────────────────────────────────────────────────────
   GitHub Learning & Auto-Commit Hub — Dynamic Logic
   Handles repository exploration, live previews, and API committing
─────────────────────────────────────────────────────────────── */

let currentRepos = [];
let currentPreviewRepo = null;
const DEFAULT_TOKEN = ""; // Add your Personal Access Token here for standalone client use

// Language color palette mapping
const LANG_COLORS = {
    Python: "#3572A5",
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Rust: "#dea584",
    Go: "#00ADD8",
    Java: "#b07219",
    C: "#555555",
    "C++": "#f34b7d",
    Jupyter: "#DA5B0B",
    Shell: "#89e051",
    Ruby: "#701516",
    PHP: "#4F5D95"
};

document.addEventListener("DOMContentLoaded", () => {
    checkAuthStatus();
    triggerSearch();

    document.getElementById("btn-history").addEventListener("click", openHistoryModal);
});

/* ── Status & Connection Check ── */
async function checkAuthStatus() {
    const statusDot = document.getElementById("status-dot");
    const statusText = document.getElementById("status-text");

    try {
        const resp = await fetch("/api/status");
        if (resp.ok) {
            const data = await resp.json();
            if (data.authenticated) {
                statusDot.classList.remove("disconnected");
                statusText.innerHTML = `Connected as <strong>${data.username}</strong>`;
                return;
            }
        }
    } catch (e) {
        // Fallback or standalone client check
    }

    try {
        const directResp = await fetch("https://api.github.com/user", {
            headers: { "Authorization": `token ${DEFAULT_TOKEN}` }
        });
        if (directResp.ok) {
            const data = await directResp.json();
            statusDot.classList.remove("disconnected");
            statusText.innerHTML = `Connected as <strong>${data.login}</strong>`;
        } else {
            statusDot.classList.add("disconnected");
            statusText.textContent = "Token Auth Failed";
        }
    } catch (e) {
        statusDot.classList.add("disconnected");
        statusText.textContent = "Offline / API Error";
    }
}

/* ── Topic Selector ── */
function selectTopic(topic) {
    document.getElementById("topic-input").value = topic;
    
    const pills = document.querySelectorAll(".topic-pill");
    pills.forEach(p => {
        if (p.textContent.toLowerCase().includes(topic.toLowerCase())) {
            p.classList.add("active");
        } else {
            p.classList.remove("active");
        }
    });

    triggerSearch();
}

/* ── Repository Search ── */
async function triggerSearch() {
    const topic = document.getElementById("topic-input").value.trim() || "machine-learning";
    const minStars = document.getElementById("min-stars").value;
    const sortBy = document.getElementById("sort-by").value;
    const grid = document.getElementById("repo-grid");
    const statsEl = document.getElementById("results-stats");

    grid.innerHTML = `
        <div class="empty-state">
            <div class="spinner"></div>
            <p>Scanning GitHub for high-quality repos about <strong>${topic}</strong>...</p>
        </div>
    `;

    try {
        let items = [];
        try {
            const res = await fetch(`/api/search?topic=${encodeURIComponent(topic)}&min_stars=${minStars}&sort=${sortBy}`);
            if (res.ok) {
                const data = await res.json();
                items = data.items || [];
            }
        } catch (err) {
            const q = `topic:${topic} stars:>${minStars} fork:false`;
            const ghRes = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=${sortBy}&order=desc&per_page=30`, {
                headers: { "Authorization": `token ${DEFAULT_TOKEN}` }
            });
            const data = await ghRes.json();
            items = data.items || [];
        }

        currentRepos = items;

        if (items.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>No repositories found for topic "<strong>${topic}</strong>" with >${minStars} stars.</p>
                    <button class="btn-secondary" style="margin: 16px auto;" onclick="selectTopic('python')">Try 'python' instead</button>
                </div>
            `;
            statsEl.textContent = "0 repositories found.";
            return;
        }

        statsEl.innerHTML = `Showing top <strong>${items.length}</strong> repositories for <strong>${topic}</strong> (> ${minStars} stars)`;
        renderRepos(items);
    } catch (error) {
        grid.innerHTML = `
            <div class="empty-state">
                <p style="color: var(--gh-red);">Failed to fetch repositories: ${error.message}</p>
            </div>
        `;
    }
}

/* ── Render Repositories Grid ── */
function renderRepos(repos) {
    const grid = document.getElementById("repo-grid");
    grid.innerHTML = "";

    repos.forEach(repo => {
        const langColor = LANG_COLORS[repo.language] || "#8b949e";
        const isForked = repo.already_forked;

        const card = document.createElement("div");
        card.className = "repo-card";
        card.innerHTML = `
            <div>
                <div class="repo-header">
                    <div class="repo-title-group">
                        <svg class="repo-icon" width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 0 1 1-1ZM5 12.25v3.25a.25.25 0 0 0 .4.2l1.45-1.087a.249.249 0 0 1 .3 0L8.6 15.7a.25.25 0 0 0 .4-.2v-3.25a.25.25 0 0 0-.25-.25h-3.5a.25.25 0 0 0-.25.25Z"></path>
                        </svg>
                        <a href="${repo.html_url}" target="_blank" class="repo-name">${repo.full_name}</a>
                    </div>
                    ${isForked ? `<span class="forked-badge">✓ Committed</span>` : ""}
                </div>

                <p class="repo-description">${repo.description || "No description provided."}</p>

                <div class="repo-meta">
                    ${repo.language ? `
                    <div class="meta-item">
                        <span class="lang-color" style="background-color: ${langColor};"></span>
                        <span>${repo.language}</span>
                    </div>` : ""}
                    <div class="meta-item">
                        ⭐ ${repo.stargazers_count.toLocaleString()}
                    </div>
                    <div class="meta-item">
                        🍴 ${repo.forks_count.toLocaleString()}
                    </div>
                </div>
            </div>

            <div class="repo-actions">
                <button class="btn-preview" onclick="openPreviewModal('${repo.full_name}')">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.622-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.825.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1 -.001-3.999A2 2 0 0 1 8 10Z"></path>
                    </svg>
                    Preview
                </button>
                <button class="btn-fork-card ${isForked ? 'disabled' : ''}" onclick="forkRepoDirect('${repo.full_name}')" ${isForked ? 'disabled' : ''}>
                    ${isForked ? 'Committed' : 'Fork / Commit'}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

/* ── Preview Modal Logic ── */
async function openPreviewModal(fullName) {
    const modal = document.getElementById("preview-modal");
    modal.classList.add("active");

    const repo = currentRepos.find(r => r.full_name === fullName) || { full_name: fullName };
    currentPreviewRepo = repo;

    document.getElementById("preview-title").textContent = repo.full_name;
    document.getElementById("preview-avatar").src = repo.owner ? repo.owner.avatar_url : `https://github.com/${fullName.split('/')[0]}.png`;
    document.getElementById("preview-external-link").href = repo.html_url || `https://github.com/${fullName}`;
    
    document.getElementById("stat-stars").textContent = (repo.stargazers_count || 0).toLocaleString();
    document.getElementById("stat-forks").textContent = (repo.forks_count || 0).toLocaleString();
    document.getElementById("stat-issues").textContent = (repo.open_issues_count || 0).toLocaleString();

    const forkBtn = document.getElementById("btn-modal-fork");
    if (repo.already_forked) {
        forkBtn.innerHTML = "✓ Already Committed to Your GitHub";
        forkBtn.style.background = "#21262d";
        forkBtn.disabled = true;
    } else {
        forkBtn.innerHTML = `🍴 Fork & Commit to My GitHub`;
        forkBtn.style.background = "var(--gh-green)";
        forkBtn.disabled = false;
    }

    switchTab('readme', document.querySelector(".modal-tab"));
    document.getElementById("readme-box").textContent = "Loading README preview...";

    try {
        let details = {};
        const res = await fetch(`/api/preview?repo=${encodeURIComponent(fullName)}`);
        if (res.ok) {
            details = await res.json();
        } else {
            const ghRes = await fetch(`https://api.github.com/repos/${fullName}/readme`, {
                headers: { "Authorization": `token ${DEFAULT_TOKEN}`, "Accept": "application/vnd.github.raw" }
            });
            const rawReadme = await ghRes.text();
            details.readme = rawReadme.substring(0, 3000) || "No README found.";
        }

        document.getElementById("readme-box").textContent = details.readme || repo.description || "No README available.";

        if (details.languages) {
            renderLanguages(details.languages);
        }
    } catch (e) {
        document.getElementById("readme-box").textContent = repo.description || "Preview details loaded from search.";
    }
}

function renderLanguages(languages) {
    const bar = document.getElementById("lang-progress");
    const list = document.getElementById("lang-list");
    bar.innerHTML = "";
    list.innerHTML = "";

    const total = Object.values(languages).reduce((a, b) => a + b, 0);
    if (total === 0) return;

    for (const [lang, bytes] of Object.entries(languages)) {
        const pct = ((bytes / total) * 100).toFixed(1);
        const color = LANG_COLORS[lang] || "#8b949e";

        const segment = document.createElement("div");
        segment.className = "lang-segment";
        segment.style.width = `${pct}%`;
        segment.style.backgroundColor = color;
        segment.title = `${lang}: ${pct}%`;
        bar.appendChild(segment);

        const item = document.createElement("li");
        item.innerHTML = `<span class="lang-color" style="background-color: ${color};"></span> <strong>${lang}</strong> ${pct}%`;
        list.appendChild(item);
    }
}

function switchTab(tabName, el) {
    document.querySelectorAll(".modal-tab").forEach(t => t.classList.remove("active"));
    if (el) el.classList.add("active");

    if (tabName === 'readme') {
        document.getElementById("tab-readme").style.display = "block";
        document.getElementById("tab-stats").style.display = "none";
    } else {
        document.getElementById("tab-readme").style.display = "none";
        document.getElementById("tab-stats").style.display = "block";
    }
}

function closePreviewModal() {
    document.getElementById("preview-modal").classList.remove("active");
}

/* ── Fork / Commit Execution ── */
async function forkCurrentPreviewRepo() {
    if (!currentPreviewRepo) return;
    await executeFork(currentPreviewRepo.full_name);
    closePreviewModal();
}

async function forkRepoDirect(fullName) {
    await executeFork(fullName);
}

async function executeFork(fullName) {
    const topic = document.getElementById("topic-input").value.trim() || "general";
    showToast(`Initiating fork for ${fullName}...`);

    try {
        let success = false;
        let message = "";
        let forkUrl = "";

        try {
            const res = await fetch("/api/fork", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repo: fullName, topic: topic })
            });
            const data = await res.json();
            success = data.success;
            message = data.message;
            forkUrl = data.fork_url;
        } catch (e) {
            const ghRes = await fetch(`https://api.github.com/repos/${fullName}/forks`, {
                method: "POST",
                headers: { "Authorization": `token ${DEFAULT_TOKEN}`, "Accept": "application/vnd.github+json" }
            });
            if (ghRes.ok || ghRes.status === 202) {
                const data = await ghRes.json();
                success = true;
                forkUrl = data.html_url;
                message = "Forked directly via GitHub API!";
            } else {
                const err = await ghRes.json();
                message = err.message || "Fork failed";
            }
        }

        if (success) {
            showToast(`🎉 Successfully committed ${fullName} to your GitHub!`);
            const repo = currentRepos.find(r => r.full_name === fullName);
            if (repo) repo.already_forked = true;
            renderRepos(currentRepos);
        } else {
            showToast(`⚠️ Notice: ${message || "Repository might already be forked."}`);
            const repo = currentRepos.find(r => r.full_name === fullName);
            if (repo) repo.already_forked = true;
            renderRepos(currentRepos);
        }
    } catch (error) {
        showToast(`Error: ${error.message}`);
    }
}

/* ── History Modal ── */
async function openHistoryModal() {
    const modal = document.getElementById("history-modal");
    const container = document.getElementById("history-list-container");
    modal.classList.add("active");

    container.innerHTML = `<div class="spinner"></div>`;

    try {
        let history = {};
        const res = await fetch("/api/history");
        if (res.ok) {
            const data = await res.json();
            history = data.history || {};
        }

        const entries = Object.entries(history);
        if (entries.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No learning repositories committed yet.</p>
                    <p style="font-size: 0.85rem; color: var(--gh-text-muted);">Pick a topic and click "Fork / Commit" to build your repository learning portfolio!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `<div class="history-list"></div>`;
        const listEl = container.querySelector(".history-list");

        entries.reverse().forEach(([repoName, info]) => {
            const item = document.createElement("div");
            item.className = "history-item";
            item.innerHTML = `
                <div>
                    <a href="${info.fork_url || 'https://github.com/' + repoName}" target="_blank" style="color: var(--gh-blue); font-weight: 700; text-decoration: none; font-size: 1.05rem;">
                        ${repoName}
                    </a>
                    <div style="font-size: 0.8rem; color: var(--gh-text-muted); margin-top: 4px;">
                        Topic: <strong style="color: var(--gh-purple);">${info.topic || 'general'}</strong> • ⭐ ${(info.stars || 0).toLocaleString()} • Committed on ${info.forked_on || 'recently'}
                    </div>
                </div>
                <a href="${info.fork_url || 'https://github.com/' + repoName}" target="_blank" class="btn-secondary" style="text-decoration: none;">
                    Open My Fork ↗
                </a>
            `;
            listEl.appendChild(item);
        });
    } catch (e) {
        container.innerHTML = `<p style="color: var(--gh-red);">Could not load history.</p>`;
    }
}

function closeHistoryModal() {
    document.getElementById("history-modal").classList.remove("active");
}

/* ── Toast Notifications ── */
function showToast(msg) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
        <span style="font-size: 1.2rem;">⚡</span>
        <span>${msg}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
