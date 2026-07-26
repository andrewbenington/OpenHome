source .env 2> /dev/null # only for release scripts/macos build with Apple dev ID

alias release="node ./scripts/release.mts"
alias tests="pnpm test"