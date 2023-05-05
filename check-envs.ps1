if (-not (Test-Path Env:\GH_TOKEN)) {
    Write-Error "GH_TOKEN not present. exiting"
    exit 1
}
