#!/bin/sh
OPENHOME_VERSION=$(node -e "console.log(require('./package.json').version);")
GIT_COMMIT=$(git rev-parse HEAD || echo '?')
GIT_TREE=$(git diff-index --quiet HEAD -- && echo "" || echo "-dirty")
GIT_VERSION=$(git describe --tags --dirty --match 'v*' 2>/dev/null || echo dev-$(date -u +"%Y%m%d%H%M%S"))
BUILD_DATE=$(date +"%Y-%m-%dT%H:%M:%SZ")
GIT_BRANCH=$(git branch --show-current)

GIT_STATUS="$GIT_BRANCH-$GIT_COMMIT$GIT_TREE"

echo {\"version\": \"${OPENHOME_VERSION}\", \"commit\": \"${GIT_STATUS}\", \"build_date\": \"${BUILD_DATE}\"} > src/consts/JSON/version.json
