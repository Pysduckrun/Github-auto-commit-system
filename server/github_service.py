"""
github_service.py — Core service wrapper handling GitHub REST API requests, rate limits, base64 decoding, and persistence.
"""

import os
import json
import base64
import urllib.parse
from datetime import date
from mock_data import MOCK_REPOSITORIES, MOCK_HISTORY

try:
    import requests
except ImportError:
    requests = None
    import urllib.request

# Configuration
DEFAULT_TOKEN = os.environ.get("GITHUB_TOKEN", "")
BASE_URL = "https://api.github.com"
LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fork_log.json")


def load_log():
    """Load previously committed repos from log file."""
    if os.path.exists(LOG_FILE):
        try:
            with open(LOG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading log: {e}")
    return MOCK_HISTORY


def save_log(log_data):
    """Persist learning log to disk."""
    try:
        with open(LOG_FILE, "w", encoding="utf-8") as f:
            json.dump(log_data, f, indent=2)
    except Exception as e:
        print(f"Error saving log: {e}")


def make_request(method, endpoint, token=DEFAULT_TOKEN, params=None, data=None):
    """Execute authenticated HTTP requests against GitHub REST API v3."""
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "GitHub-Learning-Hub-Server",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    url = f"{BASE_URL}{endpoint}"

    if requests:
        try:
            if method.upper() == "GET":
                resp = requests.get(url, headers=headers, params=params, timeout=10)
            elif method.upper() == "POST":
                resp = requests.post(url, headers=headers, json=data, timeout=10)
            else:
                resp = requests.request(method, url, headers=headers, json=data, timeout=10)
            return resp.status_code, resp.json()
        except Exception as e:
            return 500, {"message": str(e)}
    else:
        # Standard library fallback
        if params:
            url += "?" + urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers=headers, method=method.upper())
        if data:
            req.data = json.dumps(data).encode("utf-8")
            req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                body = resp.read().decode("utf-8")
                return resp.status, json.loads(body) if body else {}
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8")
            try:
                return e.code, json.loads(body)
            except Exception:
                return e.code, {"message": str(e)}
        except Exception as e:
            return 500, {"message": str(e)}


def search_repositories(topic="machine-learning", min_stars=100, sort="stars", page=1, token=DEFAULT_TOKEN):
    """Search top repositories matching learning topics and star thresholds."""
    q = f"topic:{topic} stars:>{min_stars} fork:false"
    if not topic or topic == "all":
        q = f"stars:>{min_stars} fork:false"
    elif " " in topic and not topic.startswith("topic:"):
        q = f"{topic} stars:>{min_stars} fork:false"

    params = {
        "q": q,
        "sort": sort,
        "order": "desc",
        "per_page": 30,
        "page": int(page)
    }
    status, data = make_request("GET", "/search/repositories", token=token, params=params)
    
    if status != 200:
        return status, MOCK_REPOSITORIES

    log = load_log()
    forked_set = set(log.keys())
    items = data.get("items", []) if isinstance(data, dict) else []
    for item in items:
        item["already_forked"] = item["full_name"] in forked_set

    return status, data


def get_repository_preview(owner_repo, token=DEFAULT_TOKEN):
    """Retrieve deep architectural metadata, language statistics, and base64 README."""
    status, repo_data = make_request("GET", f"/repos/{owner_repo}", token=token)
    readme_status, readme_data = make_request("GET", f"/repos/{owner_repo}/readme", token=token)
    lang_status, lang_data = make_request("GET", f"/repos/{owner_repo}/languages", token=token)

    readme_content = ""
    if readme_status == 200 and isinstance(readme_data, dict) and "content" in readme_data:
        try:
            readme_content = base64.b64decode(readme_data["content"]).decode("utf-8", errors="ignore")
            if len(readme_content) > 3000:
                readme_content = readme_content[:3000] + "\n\n... (Read full README directly on GitHub)"
        except Exception:
            readme_content = "Could not decode README content."

    log = load_log()
    if isinstance(repo_data, dict):
        repo_data["readme"] = readme_content
        repo_data["languages"] = lang_data if isinstance(lang_data, dict) else {}
        repo_data["already_forked"] = owner_repo in log

    return status, repo_data


def fork_repository(owner_repo, topic="general", token=DEFAULT_TOKEN):
    """Fork target repository to the authenticated user's workspace."""
    status, resp_data = make_request("POST", f"/repos/{owner_repo}/forks", token=token)

    if status in (200, 202):
        fork_url = resp_data.get("html_url", f"https://github.com/{resp_data.get('full_name')}")
        log = load_log()
        log[owner_repo] = {
            "forked_on": str(date.today()),
            "topic": topic,
            "stars": resp_data.get("stargazers_count", 0),
            "fork_url": fork_url
        }
        save_log(log)
        return 200, {
            "success": True,
            "message": "Repository successfully committed to your GitHub workspace!",
            "fork_url": fork_url
        }
    else:
        return status, {
            "success": False,
            "message": resp_data.get("message", "Fork failed or repository already exists.")
        }
