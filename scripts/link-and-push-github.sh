#!/usr/bin/env bash
# Link local studimate project to GitHub and push main (force).
# Run from Git Bash or WSL: bash scripts/link-and-push-github.sh

set -euo pipefail

REPO_URL="https://github.com/senanayakenithikas-ux/studimate.git"
COMMIT_MSG="Initial commit"

# Project root (parent of scripts/)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Working directory: $ROOT_DIR"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Initializing git repository..."
  git init
fi

git add -A

if ! git rev-parse HEAD >/dev/null 2>&1; then
  echo "Creating first commit..."
  git commit -m "$COMMIT_MSG"
elif [ -n "$(git status --porcelain)" ]; then
  echo "Staging changes and committing..."
  git commit -m "$COMMIT_MSG"
else
  echo "Nothing to commit (working tree clean)."
fi

git branch -M main

if git remote get-url origin >/dev/null 2>&1; then
  echo "Updating remote origin -> $REPO_URL"
  git remote set-url origin "$REPO_URL"
else
  echo "Adding remote origin -> $REPO_URL"
  git remote add origin "$REPO_URL"
fi

echo "Force pushing to origin main..."
git push -u origin main --force

echo "Done. Remote: $(git remote get-url origin)"
git status -sb
