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

COMMITTED=false
COMMIT_MSG=""

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
    COMMITTED=true
    COMMIT_MSG="$commit_msg"
    echo -e "${GREEN}✓ Committed.${NC}"
  fi
fi

# --- 3. Publish parameters ---
echo -e "\n${BOLD}Publish parameters${NC} (Press Enter to accept defaults)"

VERSION_TYPE_DEFAULT="patch"
read -rp "Version type [${VERSION_TYPE_DEFAULT}]: " version_type
version_type="${version_type:-$VERSION_TYPE_DEFAULT}"

read -rp "Custom version [leave empty for version_type]: " custom_version

DIST_TAG_DEFAULT="latest"
read -rp "npm dist tag [${DIST_TAG_DEFAULT}]: " dist_tag
dist_tag="${dist_tag:-$DIST_TAG_DEFAULT}"

# --- 4. Bump version ---
echo -e "\n${BOLD}Bumping version...${NC}"
if [ -n "$custom_version" ]; then
  npm version "$custom_version" --no-git-tag-version
  NEW_VERSION="$custom_version"
else
  OUTPUT=$(npm version "$version_type" --no-git-tag-version)
  NEW_VERSION="${OUTPUT:1}"
fi
echo -e "${GREEN}✓ Version: $NEW_VERSION${NC}"

# --- 5. Commit the version bump (amend if we committed in step 2) ---
git add package.json package-lock.json

if [ "$COMMITTED" = true ]; then
  git commit --amend -m "v${NEW_VERSION}: ${COMMIT_MSG}"
  echo -e "${GREEN}✓ Amended last commit${NC}"
else
  git commit -m "v${NEW_VERSION}"
  echo -e "${GREEN}✓ Created version commit${NC}"
fi

# --- 6. Tag ---
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"
echo -e "${GREEN}✓ Tagged v${NEW_VERSION}${NC}"

# --- 7. Push ---
echo -e "\n${BOLD}Pushing commits and tags...${NC}"
git push origin HEAD
git push origin --tags
echo -e "${GREEN}✓ Pushed.${NC}"

# --- 8. Trigger publish workflow ---
echo -e "\n${BOLD}Triggering GitHub Publish workflow...${NC}"
GH_CMD=("gh" "workflow" "run" "publish.yml" \
  "--field" "dist_tag=${dist_tag}")

echo -e "${CYAN}Triggering:${NC} ${GH_CMD[*]}"
"${GH_CMD[@]}"
echo -e "${GREEN}✓ Workflow triggered.${NC}"

sleep 2

# --- 9. Watch and report ---
RUN_ID=$(gh run list --workflow=publish.yml --limit=1 \
  --json databaseId --jq '.[0].databaseId')
echo -e "Run ID: ${CYAN}${RUN_ID}${NC}"

gh run watch "$RUN_ID"

# --- 10. Fetch tag ---
echo -e "\n${BOLD}Fetching latest tag...${NC}"
git fetch --tags 2>/dev/null
LATEST_TAG=$(git tag --sort=-version:refname | head -1)

echo ""
echo -e "  ✅ ${GREEN}${BOLD}Published!${NC}"
echo -e "  ${BOLD}New version: ${CYAN}${LATEST_TAG}${NC}${BOLD}${NC}"
