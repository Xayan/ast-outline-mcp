#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}================================="
echo "  ast-outline-mcp Release Tool"
echo -e "=================================${NC}"

# --- 1. Unstaged changes ---
if [ -n "$(git diff --name-only)" ]; then
  echo -e "\n${YELLOW}Unstaged changes:${NC}"
  git diff --name-only | sed 's/^/  /'
  read -rp "Stage all? [Y/n] " stage_confirm
  if [[ "$stage_confirm" =~ ^[Yy]?$ ]]; then
    git add -A
    echo -e "${GREEN}✓ Staged all changes.${NC}"
  fi
fi

# --- 2. Staged changes → commit ---
if [ -n "$(git diff --cached --name-only)" ]; then
  echo -e "\n${YELLOW}Staged changes:${NC}"
  git diff --cached --name-only | sed 's/^/  /'
  read -rp "Commit them? [Y/n] " commit_confirm
  if [[ "$commit_confirm" =~ ^[Yy]?$ ]]; then
    read -rp "Commit message: " commit_msg
    git commit -m "$commit_msg"
    echo -e "${GREEN}✓ Committed.${NC}"
  fi
fi

# --- 3. Push ---
echo -e "\n${BOLD}Pushing to remote...${NC}"
git push
echo -e "${GREEN}✓ Pushed.${NC}"

# --- 4. Workflow parameters ---
echo -e "\n${BOLD}Workflow parameters${NC} (Press Enter to accept defaults)"

VERSION_TYPE_DEFAULT="patch"
read -rp "Version type [${VERSION_TYPE_DEFAULT}]: " version_type
version_type="${version_type:-$VERSION_TYPE_DEFAULT}"

read -rp "Custom version [leave empty for version_type]: " custom_version

DIST_TAG_DEFAULT="latest"
read -rp "npm dist tag [${DIST_TAG_DEFAULT}]: " dist_tag
dist_tag="${dist_tag:-$DIST_TAG_DEFAULT}"

# --- 5. Trigger workflow ---
GH_CMD=("gh" "workflow" "run" "release-publish.yml" \
  "--field" "version_type=${version_type}")
if [ -n "$custom_version" ]; then
  GH_CMD+=("--field" "custom_version=${custom_version}")
fi
GH_CMD+=("--field" "dist_tag=${dist_tag}")

echo -e "\n${CYAN}Triggering:${NC} ${GH_CMD[*]}"
"${GH_CMD[@]}"
echo -e "${GREEN}✓ Workflow triggered.${NC}"

# --- 6. Watch and report ---
sleep 2
RUN_ID=$(gh run list --workflow=release-publish.yml --limit=1 \
  --json databaseId --jq '.[0].databaseId')
echo -e "Run ID: ${CYAN}${RUN_ID}${NC}"

gh run watch "$RUN_ID"

echo -e "\n${BOLD}Fetching new version tag...${NC}"
git fetch --tags origin 2>/dev/null
LATEST_TAG=$(git tag --sort=-version:refname | head -1)

# --- 7. git pull ---
echo -e "\n${BOLD}Pulling latest changes...${NC}"
git pull

# --- 8. Report ---

echo ""
echo -e "${GREEN}${BOLD}✅ Published!${NC} ${BOLD}New version: ${CYAN}${LATEST_TAG}${NC}${BOLD}${NC}"
