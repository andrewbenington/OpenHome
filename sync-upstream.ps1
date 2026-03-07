# Script to safely test and merge upstream changes
# Usage: .\sync-upstream.ps1

param(
    [switch]$DryRun = $false
)

Write-Host "Fetching upstream changes..." -ForegroundColor Cyan
git fetch upstream

if ($DryRun) {
    Write-Host "`n=== DRY RUN MODE ===" -ForegroundColor Yellow
    Write-Host "Creating temporary branch to test merge..." -ForegroundColor Cyan
    
    # Create temp branch from current position
    git checkout -b temp-merge-test
    
    Write-Host "`nAttempting merge from upstream/main..." -ForegroundColor Cyan
    git merge upstream/main --no-commit --no-ff
    
    $mergeStatus = $LASTEXITCODE
    
    if ($mergeStatus -eq 0) {
        Write-Host "`n✓ Merge would succeed cleanly!" -ForegroundColor Green
        Write-Host "`nFiles that would be updated:" -ForegroundColor Cyan
        git diff --name-only HEAD upstream/main
    } else {
        Write-Host "`n⚠ Merge conflicts detected:" -ForegroundColor Yellow
        git diff --name-only --diff-filter=U
        Write-Host "`nConflicting files listed above. Review before actual merge." -ForegroundColor Yellow
    }
    
    Write-Host "`nAborting test merge and returning to my-features..." -ForegroundColor Cyan
    git merge --abort 2>$null
    git checkout my-features
    git branch -D temp-merge-test
    
} else {
    Write-Host "`n=== REAL MERGE MODE ===" -ForegroundColor Green
    Write-Host "Merging upstream/main into my-features..." -ForegroundColor Cyan
    
    git merge upstream/main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ Merge successful!" -ForegroundColor Green
        Write-Host "Don't forget to push: git push origin my-features" -ForegroundColor Cyan
    } else {
        Write-Host "`n⚠ Conflicts detected. Resolve them, then:" -ForegroundColor Yellow
        Write-Host "  git add <resolved-files>" -ForegroundColor White
        Write-Host "  git commit" -ForegroundColor White
    }
}
