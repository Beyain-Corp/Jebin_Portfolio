#!/usr/bin/env bash
# ==============================================================================
# Jenkins / OCI Linux Automated Notion Sync Script
# Jebin Joseph J. - Enterprise IT Infrastructure Portfolio
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "[INFO] Starting Notion sync at $(date)..."

# Ensure Node.js is present
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js 18+ is not installed or not in PATH."
    exit 1
fi

# Run the Notion sync engine
node scripts/sync-notion.js

# Stage generated assets and files
git add assets/data/articles.json assets/img/notion/ index.html

# Check for staged changes
if ! git diff --staged --quiet; then
    echo "[INFO] New or updated articles detected from Notion. Committing..."
    git config user.name "Jenkins Automation [OCI]"
    git config user.email "jenkins-bot@beyain-corp.com"
    git commit -m "chore(cms): auto-sync articles from Notion [skip ci]"
    
    echo "[INFO] Pushing changes to GitHub main branch..."
    # If GH_TOKEN is provided in environment, push authenticated, else standard git push
    if [[ -n "${GH_TOKEN:-}" && -n "${GH_USER:-}" ]]; then
        git push "https://${GH_USER}:${GH_TOKEN}@github.com/Beyain-Corp/Jebin_Portfolio.git" HEAD:main
    else
        git push origin main
    fi
    echo "[SUCCESS] Successfully synced and pushed to GitHub! GitHub Pages will auto-deploy."
else
    echo "[INFO] No changes detected. Portfolio is already up to date with Notion."
fi

