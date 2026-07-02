"""
mock_data.py — Fallback mock repository data and sample learning log for offline or rate-limited scenarios.
"""

MOCK_REPOSITORIES = {
    "total_count": 3,
    "incomplete_results": False,
    "items": [
        {
            "full_name": "tiangolo/fastapi",
            "html_url": "https://github.com/tiangolo/fastapi",
            "description": "FastAPI framework, high performance, easy to learn, fast to code, ready for production",
            "stargazers_count": 72500,
            "forks_count": 6100,
            "open_issues_count": 450,
            "language": "Python",
            "owner": {
                "login": "tiangolo",
                "avatar_url": "https://avatars.githubusercontent.com/u/1326112?v=4"
            }
        },
        {
            "full_name": "huggingface/transformers",
            "html_url": "https://github.com/huggingface/transformers",
            "description": "State-of-the-art Machine Learning for Pytorch, TensorFlow, and JAX.",
            "stargazers_count": 128000,
            "forks_count": 25400,
            "open_issues_count": 920,
            "language": "Python",
            "owner": {
                "login": "huggingface",
                "avatar_url": "https://avatars.githubusercontent.com/u/25720743?v=4"
            }
        },
        {
            "full_name": "rust-lang/rust",
            "html_url": "https://github.com/rust-lang/rust",
            "description": "Empowering everyone to build reliable and efficient software.",
            "stargazers_count": 95000,
            "forks_count": 12200,
            "open_issues_count": 9800,
            "language": "Rust",
            "owner": {
                "login": "rust-lang",
                "avatar_url": "https://avatars.githubusercontent.com/u/5430905?v=4"
            }
        }
    ]
}

MOCK_HISTORY = {
    "tiangolo/fastapi": {
        "forked_on": "2026-06-30",
        "topic": "fastapi",
        "stars": 72500,
        "fork_url": "https://github.com/yourusername/fastapi"
    }
}
