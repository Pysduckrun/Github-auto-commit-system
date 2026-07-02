#!/usr/bin/env python3
"""
daily_fork.py — Background recurring CLI automation script scheduled via Windows Task Scheduler or cron.
Automatically forks curated trending repositories across specified technology topics.
"""

import random
import time
from datetime import date
from github_service import search_repositories, fork_repository, load_log, DEFAULT_TOKEN

TOPICS = [
    "machine-learning", "fastapi", "python", "rust", 
    "mlops", "docker", "data-science", "react", "genai"
]
REPOS_TO_FORK_PER_DAY = 2
FORK_DELAY_SECONDS = 5


def run_daily_fork():
    print(f"\n🚀 Running Daily GitHub Learning Forker | {date.today()}\n" + "─"*50)
    log = load_log()
    already_forked = set(log.keys())
    
    topics_today = random.sample(TOPICS, k=min(REPOS_TO_FORK_PER_DAY, len(TOPICS)))
    forked_count = 0

    for topic in topics_today:
        if forked_count >= REPOS_TO_FORK_PER_DAY:
            break

        print(f"↳ Searching topic: {topic}")
        status, data = search_repositories(topic=topic, min_stars=200, token=DEFAULT_TOKEN)
        items = data.get("items", [])
        candidates = [r for r in items if r["full_name"] not in already_forked]

        if not candidates:
            print(f"  ⚠ No new repository candidates found for topic '{topic}'")
            continue

        chosen_repo = random.choice(candidates[:10])
        full_name = chosen_repo["full_name"]
        print(f"  Forking target: {full_name} (⭐ {chosen_repo.get('stargazers_count'):,})")

        status, result = fork_repository(full_name, topic=topic, token=DEFAULT_TOKEN)
        if result.get("success"):
            print(f"  ✓ Success! Available at: {result.get('fork_url')}")
            forked_count += 1
        else:
            print(f"  ✗ Notice: {result.get('message')}")

        if forked_count < REPOS_TO_FORK_PER_DAY:
            time.sleep(FORK_DELAY_SECONDS)

    print("\n" + "─"*50 + f"\n✓ Finished run. {forked_count} new learning repos added today.\n")


if __name__ == "__main__":
    run_daily_fork()
