# Maintaining Your OpenHome Fork

## Conflict Prevention Strategies

### 1. Regular Syncing (Recommended: Weekly)
Merge upstream changes frequently to avoid large divergences:
```bash
# Test merge first (safe)
.\sync-upstream.ps1 -DryRun

# If clean, do real merge
.\sync-upstream.ps1
```

### 2. Code Isolation Practices

**Your custom features are already well-isolated:**
✓ Progression system in separate files (`src/ui/progression/*`)
✓ Rewards in dedicated directory (`src-tauri/src/rewards/*`)
✓ New Rust modules (`progression_rewards.rs`, `progression_storage.rs`)

**To maintain this:**
- Keep custom features in dedicated files/folders when possible
- Use conditional imports/exports for your additions
- Comment your changes in shared files with `// CUSTOM:` prefix

### 3. High-Risk Files to Watch

These files you modified are likely to change upstream:

**Core UI (High Risk):**
- `src/ui/App.tsx` - App structure
- `src/ui/AppTabs.tsx` - Tab routing
- `src/ui/backend/*` - Backend interface

**Dependencies (Medium Risk):**
- `package.json` - npm dependencies
- `src-tauri/Cargo.toml` - Rust dependencies

**Your Changes (Low Risk):**
- Pokedex components - Less frequently changed
- New progression files - No conflicts possible

### 4. Merge Conflict Resolution Tips

When conflicts occur:

1. **Review the conflict:**
   ```bash
   git status  # See conflicting files
   git diff    # See conflict markers
   ```

2. **With diff3 enabled, you'll see:**
   ```
   <<<<<<< HEAD (your changes)
   your code
   ||||||| common ancestor (original)
   original code
   =======
   upstream changes
   >>>>>>> upstream/main
   ```

3. **Resolve strategically:**
   - For dependencies: Take upstream version, then re-add your specifics
   - For UI components: Merge both sets of changes manually
   - For new files: Your version wins (no conflict)

### 5. Branch Strategy

**Current setup (good):**
- `main` - tracks upstream
- `my-features` - your working branch

**Consider adding:**
- `stable` - your last known working state
- Create before risky merges: `git branch stable my-features`

### 6. Before Each Merge Checklist

- [ ] Commit all working changes
- [ ] Run `.\sync-upstream.ps1 -DryRun` first
- [ ] Review conflicting files list
- [ ] Create backup branch: `git branch backup-$(Get-Date -Format 'yyyy-MM-dd')`
- [ ] Proceed with merge
- [ ] Test build: `pnpm install && pnpm tauri build`
- [ ] Push to your fork

### 7. Emergency Recovery

If a merge goes badly:
```bash
# Abort ongoing merge
git merge --abort

# Or reset to before merge
git reset --hard backup-2026-03-06
```

## Automation Helper

Use the provided `sync-upstream.ps1` script:
- **Dry run mode:** Tests merge without changing files
- **Real mode:** Performs actual merge
- Automatically shows conflicts and affected files
