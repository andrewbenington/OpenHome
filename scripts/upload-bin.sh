#!/bin/bash

# AI Slop for the most part

# Usage: ./upload-release.sh <dir-with-binary> <binary-prefix> [content-type]
# Requires: GITHUB_TOKEN env var, gh CLI or curl
# Repo is inferred from git remote, or set GITHUB_REPO=owner/repo

BINARY_DIR="${1:-}"
if [[ -z "$BINARY_DIR" ]]; then
  echo "Usage: $0 <dir-with-binary> <binary-prefix> [content-type]" >&2
  exit 1
fi

BINARY_PREFIX="${2:-}"
if [[ -z "$BINARY_PREFIX" ]]; then
  echo "Usage: $0 <dir-with-binary> <binary-prefix> [content-type]" >&2
  exit 1
fi

BINARY_FILE=$(find "$BINARY_DIR" -maxdepth 1 -name "${BINARY_PREFIX}*" | head -1)

if [[ -z "${BINARY_FILE:-}" ]]; then
  echo "Error: no file with prefix '$BINARY_PREFIX' found in directory '$BINARY_DIR' is not set" >&2
  exit 1
fi

echo "File: $BINARY_FILE"

CONTENT_TYPE="${3:-application/octet-stream}"

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "Error: GITHUB_TOKEN is not set" >&2
  exit 1
fi

# Infer repo from git remote if not set
if [[ -z "${GITHUB_REPO:-}" ]]; then
  REMOTE=$(git remote get-url origin 2>/dev/null || true)
  GITHUB_REPO=$(echo "$REMOTE" | sed -E 's|.*github\.com[:/]||; s|\.git$||')
  if [[ -z "$GITHUB_REPO" ]]; then
    echo "Error: could not infer repo from git remote. Set GITHUB_REPO=owner/repo" >&2
    exit 1
  fi
fi

echo "Repo: $GITHUB_REPO"

# Get the latest release
RELEASE=$(curl -L \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2026-03-10" \
  "https://api.github.com/repos/$GITHUB_REPO/releases/latest")


RELEASE_ID=$(echo "$RELEASE" | grep -m1 '"id"' | head -1 | grep -o '[0-9]*')
TAG=$(echo "$RELEASE" | grep '"tag_name"' | head -1 | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')
UPLOAD_URL=$(echo "$RELEASE" | grep '"upload_url"' | head -1 | sed -E 's/.*"upload_url": *"([^"]+)\{.*/\1/')

echo "Attaching to release: $RELEASE_ID ($TAG)"


if [[ -z "$RELEASE_ID" || -z "$UPLOAD_URL" ]]; then
  echo "UHOH"
  echo "Error: could not fetch latest release" >&2
  exit 1
fi

echo "Latest release: $TAG (id: $RELEASE_ID)"

FILENAME=$(basename "$BINARY_FILE")

# Check if asset already exists and delete it
EXISTING_ASSET_ID=$(echo "$RELEASE" | grep -A2 "\"name\": \"$FILENAME\"" | grep '"id"' | grep -o '[0-9]*' | head -1)
if [[ -n "$EXISTING_ASSET_ID" ]]; then
  echo "Deleting existing asset: $FILENAME (id: $EXISTING_ASSET_ID)"
  curl -sf \
    -X DELETE \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$GITHUB_REPO/releases/assets/$EXISTING_ASSET_ID"
fi

echo "Uploading $FILENAME..."
RESPONSE=$(curl \
  -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "Content-Type: $CONTENT_TYPE" \
  --data-binary "@$BINARY_FILE" \
  "$UPLOAD_URL?name=$FILENAME")

ASSET_URL=$(echo "$RESPONSE" | grep '"browser_download_url"' | sed -E 's/.*"browser_download_url": *"([^"]+)".*/\1/')
echo "✓ Uploaded: $ASSET_URL"