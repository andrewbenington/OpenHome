/**
 * DISCLAIMER: AI SLOP
 *
 * Usage:
 *   pnpm release --patch     # 1.2.0 -> 1.2.1
 *   pnpm release --minor     # 1.2.0 -> 1.3.0
 *   pnpm release --major     # 1.2.0 -> 2.0.0
 *   pnpm release 1.5.0-beta.1 # explicit version
 *
 * Env:
 *   GITHUB_TOKEN   required — repo:contents + repo:releases scope
 *
 * package.json:
 *   "scripts": { "release": "tsx scripts/release.ts" }
 *
 * Install deps:
 *   pnpm add -D tsx execa @octokit/rest
 */

import { Octokit } from '@octokit/rest'
import chalk from 'chalk'
import { readFileSync } from 'node:fs'

// ---- Config: adjust to your repo -----------------------------------------

const OWNER = 'andrewbenington'
const REPO = 'OpenHome'
const PACKAGE_JSON = 'package.json'
const CARGO_TOML = 'src-tauri/Cargo.toml'
const TAURI_CONF = 'src-tauri/tauri.conf.json'

// Glob-ish list of build artifacts to upload. Adjust to your target platform(s).
// These paths are typical Tauri v2 bundle output locations.
const ASSET_GLOBS = [
  'src-tauri/target/release/bundle/msi/*.msi',
  'src-tauri/target/release/bundle/nsis/*.exe',
  'src-tauri/target/release/bundle/dmg/*.dmg',
  'src-tauri/target/release/bundle/appimage/*.AppImage',
  'src-tauri/target/release/bundle/deb/*.deb',
]

// ---------------------------------------------------------------------------

function fail(message: string): never {
  console.log(chalk.bold.red('✖ Build failed'))
  console.error(`\n✖ ${message}\n`)
  process.exit(1)
}

function readJson<T = any>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

// returns version without leading v
function getCurrentVersion(): string {
  if (process.env.CURRENT_VERSION) {
    return process.env.CURRENT_VERSION
  }
  const pkg = readJson<{ version: string }>(PACKAGE_JSON)
  return pkg.version
}

// ---- GitHub release --------------------------------------------------------

async function createGithubRelease(octokit: Octokit, version: string, body?: string) {
  console.log(`\n→ Creating GitHub release ${version}...`)
  const release = await octokit.rest.repos.createRelease({
    owner: OWNER,
    repo: REPO,
    tag_name: `v${version}`,
    name: `v${version}`,
    body,
    generate_release_notes: true,
    draft: true,
    prerelease: version.includes('-'), // e.g. 1.5.0-beta.1
  })
  console.log(`  Created: ${release.data.html_url}`)
  return release.data
}

const EMPTY_BODY = 'See the assets to download this version and install.'

async function publishLatestRelease(octokit: Octokit) {
  const currentVersion = getCurrentVersion()
  const latestRelease = await getNewestRelease(octokit)

  if (!latestRelease) {
    fail('No release found')
  } else if (!latestRelease.draft && latestRelease.body !== EMPTY_BODY) {
    fail(`Latest release is already published: ${latestRelease.html_url}`)
  } else if (!latestRelease.tag_name.endsWith(currentVersion)) {
    fail(
      `Current version is ${currentVersion}, but latest release is ${latestRelease.tag_name}: ${latestRelease.html_url}`
    )
  }

  console.log(`\n→ Publishing Github release ${latestRelease.tag_name}...`)
  let body = latestRelease.body ?? (await currentVersionPullRequestDescription(octokit))
  let release = await octokit.rest.repos.updateRelease({
    owner: OWNER,
    repo: REPO,
    release_id: latestRelease.id,
    body,
    prerelease: false,
    make_latest: 'true',
    draft: false,
  })

  console.log(`  Publshed: ${release.data.html_url}`)
  return release
}

async function finalizeLatestReleaseBody(octokit: Octokit) {
  const currentVersion = getCurrentVersion()
  const latestRelease = await getNewestRelease(octokit, currentVersion)
  if (!latestRelease) {
    fail('No release found')
  } else if (!latestRelease.tag_name.endsWith(currentVersion)) {
    fail(
      `Current version is ${currentVersion}, but latest release is ${latestRelease.tag_name}: ${latestRelease.html_url}`
    )
  }

  console.log(`\n→ Updating Github release ${latestRelease.tag_name}...`)
  let release = await octokit.rest.repos.updateRelease({
    owner: OWNER,
    repo: REPO,
    release_id: latestRelease.id,
    body:
      latestRelease.body === EMPTY_BODY
        ? await currentVersionPullRequestDescription(octokit)
        : latestRelease.body || undefined,
    prerelease: false,
    make_latest: 'legacy',
    draft: false,
  })

  console.log(`  Publshed: ${release.data.html_url}`)
  return release
}

async function deleteGithubRelease(octokit: Octokit, releaseId: number) {
  console.log('\n→ Deleting GitHub release...')
  const release = await octokit.rest.repos.deleteRelease({
    owner: OWNER,
    repo: REPO,
    release_id: releaseId,
  })
  console.log('  Deleted')
  return release.data
}

async function findReleasePullRequest(octokit: Octokit, version: string) {
  const iterator = octokit.paginate.iterator(octokit.rest.pulls.list, {
    owner: OWNER,
    repo: REPO,
    state: 'closed',
    per_page: 100,
  })

  for await (const { data: pullRequests } of iterator) {
    const match = pullRequests.find(
      (pullRequest) =>
        pullRequest.title.startsWith(`[RELEASE] ${version}`) ||
        pullRequest.title.startsWith(`[RELEASE] v${version}`)
    )
    if (match) return match
  }

  return undefined
}

async function currentVersionPullRequestDescription(octokit: Octokit) {
  const currentVersion = getCurrentVersion()
  let body = (await findReleasePullRequest(octokit, currentVersion))?.body || undefined
  return body
    ?.replace('**Description**', '## Description')
    .replaceAll('Fix ', 'Fixed ')
    .replaceAll('fix ', 'fixed ')
    .split('\n**Issue**')[0]
}

async function getNewestRelease(octokit: Octokit, tag?: string) {
  console.log('\n→ Retrieving latest release...')
  const { data } = await octokit.rest.repos.listReleases({
    owner: OWNER,
    repo: REPO,
    per_page: 5,
  })

  console.log('  Retrieved')

  if (tag) {
    const matching = data.find((release) => release.tag_name === `v${tag}`)
    if (matching) {
      return matching
    }

    fail(`No release found in windows`)
  }

  if (data.length === 0) {
    fail(`No releases found`)
  }

  return data[0]
}

async function createNewRelease(octokit: Octokit) {
  const currentVersion = getCurrentVersion()

  // const currentVersion = fs
  const latestRelease = await getNewestRelease(octokit)
  let body = await currentVersionPullRequestDescription(octokit)
  if (latestRelease.tag_name !== `v${currentVersion}`) {
    await createGithubRelease(octokit, currentVersion, body)
  } else if (latestRelease.draft) {
    await deleteGithubRelease(octokit, latestRelease.id)
    await createGithubRelease(octokit, currentVersion, body)
  }
}

// ---- Main ------------------------------------------------------------------

async function main() {
  const token = process.env.GITHUB_TOKEN
  if (!token) fail('GITHUB_TOKEN environment variable is required.')

  const args = process.argv.slice(2)
  console.log('\n→ Authenticating...')
  const octokit = new Octokit({ auth: token })
  console.log('  Authenticated')

  if (args.length > 0) {
    switch (args[0]) {
      case 'new-release':
        return await createNewRelease(octokit)
      case 'finalize':
        return await finalizeLatestReleaseBody(octokit)
      case 'display-description':
        console.log('\n' + (await currentVersionPullRequestDescription(octokit)))
    }

    return
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
