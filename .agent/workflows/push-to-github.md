---
description: Push the current project to GitHub using the GitHub CLI (gh)
---

This workflow automates the process of staging, committing, and pushing your changes to GitHub. If a remote repository doesn't exist, it will create one for you.

### Prerequisites

- [GitHub CLI (gh)](https://cli.github.com/) installed.
- Logged in to your GitHub account via `gh auth login`.

### Steps

1. **Check Authentication**
   Ensure you are logged in to GitHub.
   ```bash
   gh auth status
   ```

2. **Stage and Commit Changes**
   Stage all changes and prompt for a commit message.
   // turbo
   ```bash
   git add .
   ```
   *Note: You will need to commit manually or provide a message.*
   ```bash
   git commit -m "chore: automated push to github" || echo "No changes to commit"
   ```

3. **Check for Existing Remote**
   If no remote `origin` is found, create a new GitHub repository.
   ```bash
   git remote get-url origin || gh repo create $(basename $(pwd)) --public --source=. --remote=origin --push
   ```

4. **Push to GitHub**
   Push the current branch to `origin`.
   // turbo
   ```bash
   git push -u origin $(git branch --show-current)
   ```
