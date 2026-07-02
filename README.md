# 🚀 GitHub Auto-Commit & Learning Hub

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Python Version](https://img.shields.io/badge/Python-3.8%2B-green.svg)
![Frontend UI](https://img.shields.io/badge/Frontend-Vanilla%20JS%20%7C%20CSS3-blueviolet.svg)
![GitHub API](https://img.shields.io/badge/GitHub%20REST%20API-v3-blue.svg)

An automated full-stack web application designed to help developers systematically discover, inspect, and fork top-tier open-source repositories based on personalized learning goals and technology stacks.

---

## ✨ Key Features

- **🎯 Custom Topic & Tech Stack Exploration**: Search for curated repositories across any programming language or topic (`machine-learning`, `fastapi`, `rust`, `docker`, `genai`, etc.).
- **⚡ Quality Threshold Filters**: Set custom star thresholds (100+ to 5,000+ stars) and dynamic sorting (Stars, Forks, Recently Updated) to ensure you only explore high-quality codebases.
- **🔍 Deep Interactive Preview Drawer**: Inspect repository architecture before committing! View base64-decoded `README.md` files, open issue statistics, and interactive language distribution progress bars directly inside a glassmorphic modal.
- **🍴 One-Click Forking & Auto-Committing**: Directly commit curated repositories to your personal GitHub account with one click using GitHub REST API v3 OAuth/PAT authentication.
- **📚 Automated Learning Log**: Maintains a persistent history of all repositories you have committed to your workspace, tracking learning topics and commit dates.
- **🤖 Scheduled Automation (`daily_fork.py`)**: Includes a dedicated background CLI script scheduled via Windows Task Scheduler or cron for daily automated discovery.

---

## 📁 Project Architecture

```text
github_learning_hub/
├── .gitignore                   # Excludes caches, tokens, logs, and OS artifacts
├── README.md                    # Project documentation & setup guide
├── client/                      # Frontend UI Application
│   ├── index.html               # Main application layout & GitHub brand header
│   ├── package.json             # Frontend project metadata & scripts
│   └── src/                     # Source assets
│       ├── style.css            # GitHub Dark Mode design system & glassmorphic UI
│       └── script.js            # Dynamic API client, preview drawer & commit engine
└── server/                      # Backend API & Automation Server
    ├── requirements.txt         # Python backend dependencies
    ├── main.py                  # HTTP API Router & Web Server entry point
    ├── github_service.py        # GitHub REST API wrapper (search, preview, fork logic)
    ├── daily_fork.py            # Automated recurring fork scheduler script
    └── mock_data.py             # Offline fallback repository data & sample history
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Python 3.8+** installed on your system.
- A **GitHub Personal Access Token (PAT)** with `repo` and `public_repo` scopes ([Generate here](https://github.com/settings/tokens)).

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/github-learning-hub.git
cd github-learning-hub
```

### 2. Setup Backend Environment
```bash
cd server
pip install -r requirements.txt
```

### 3. Configure Your GitHub Token
Set your Personal Access Token as an environment variable or update `DEFAULT_TOKEN` inside `server/github_service.py`:
```bash
# Windows PowerShell
$env:GITHUB_TOKEN="ghp_YourPersonalAccessTokenHere"

# Linux / macOS
export GITHUB_TOKEN="ghp_YourPersonalAccessTokenHere"
```

### 4. Run the Full-Stack Application
Start the backend server from the `server/` directory:
```bash
python main.py
```
Open your browser and navigate to: **`http://localhost:5000`**

---

## 🛠️ API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/status` | Verifies GitHub authentication token & returns user avatar/details |
| `GET` | `/api/search` | Queries GitHub REST API with topic tags, min stars, and sorting |
| `GET` | `/api/preview` | Fetches repository architecture, base64 README, and language stats |
| `POST` | `/api/fork` | Forks a target repository to the authenticated user's GitHub profile |
| `GET` | `/api/history` | Retrieves the local log of previously committed learning repositories |

---

## 💻 Tech Stack

- **Frontend**: HTML5, CSS3 (GitHub Dark Mode System, Glassmorphism), JavaScript (ES6+ Asynchronous Fetch API).
- **Backend**: Python 3 (Multi-threaded HTTP Server, Requests, JSON Data Persistence).
- **APIs & Protocols**: GitHub REST API v3, Base64 Encoding/Decoding, OAuth/PAT Authentication.

---

## 📄 License
This project is licensed under the MIT License.
