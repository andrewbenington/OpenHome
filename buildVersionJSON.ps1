$OPENHOME_VERSION = (Get-Content -Path './package.json' | ConvertFrom-Json).version
$GIT_COMMIT = (git rev-parse HEAD 2>$null) -replace "`n",""
$GIT_BRANCH = (git rev-parse --abbrev-ref HEAD 2>$null) -replace "`n",""
$GIT_TREE = if (git diff-index --quiet HEAD -- 2>$null) { "" } else { "-dirty" }
$BUILD_DATE = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
$GIT_STATUS = "$GIT_BRANCH-$GIT_COMMIT$GIT_TREE"

$versionData = @{
    version = $OPENHOME_VERSION
    commit = $GIT_STATUS
    build_date = $BUILD_DATE
}

New-Item "./src/consts/JSON" -Type Directory -Force > $null
$versionData | ConvertTo-Json | Out-File -Encoding utf8 "./src/consts/JSON/version.json"
