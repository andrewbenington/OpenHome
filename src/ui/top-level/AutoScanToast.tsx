import { R } from '@openhome-core/util/functional'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import { ClearIcon, InfoIcon } from '@openhome-ui/components/Icons'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { AppInfoContext } from '@openhome-ui/state/appInfo'
import { Button, Callout, Flex } from '@radix-ui/themes'
import { invoke } from '@tauri-apps/api/core'
import { useContext, useEffect, useState } from 'react'

type DetectedSave = { emulator: string; path: string; matched_pattern: string }

export default function AutoScanToast() {
  const [appInfoState] = useContext(AppInfoContext)
  const backend = useContext(BackendContext)
  const [showToast, setShowToast] = useState(false)
  const [dirMap, setDirMap] = useState<Map<string, string>>(new Map())
  const [hasScanned, setHasScanned] = useState(false)
  const displayError = useDisplayError()

  useEffect(() => {
    const doScan = async () => {
      // Wait for settings to load and saves to be populated initially to avoid false positives
      if (!appInfoState.settingsLoaded || hasScanned) return

      setHasScanned(true)

      // Only scan if setting is enabled (defaults to true)
      if (appInfoState.settings.autoScanOnStartup === false) return

      try {
        const detectedSaves = await invoke<DetectedSave[]>('scan_emulators')

        const isWin = navigator.userAgent.includes('Win')
        const sep = isWin ? '\\' : '/'

        const map = new Map<string, string>()
        detectedSaves.forEach((save) => {
          const lastIndex = save.path.lastIndexOf(sep)
          if (lastIndex !== -1) {
            const dir = save.path.substring(0, lastIndex)
            if (!map.has(dir)) {
              map.set(dir, `${save.emulator} Saves`)
            }
          }
        })

        // Find directories that we don't ALREADY have in our saveFolders state
        const folderResult = await backend.getSaveFolders()
        const existingFolders = R.isOk(folderResult) ? folderResult.value : []
        const mappedPaths = existingFolders.map((f: { path: string }) => f.path.replace(/\\/g, '/'))
        const existingPaths = new Set(mappedPaths)
        const newMap = new Map<string, string>()

        for (const [dir, label] of Array.from(map.entries())) {
          // Normalize slashes for comparison
          const normalizedDir = dir.replace(/\\/g, '/')
          if (!existingPaths.has(normalizedDir)) {
            newMap.set(dir, label)
          }
        }

        if (newMap.size > 0) {
          setDirMap(newMap)
          setShowToast(true)
        }
      } catch (err) {
        displayError('Error scanning for saves', [String(err)])
      }
    }

    doScan()
  }, [
    appInfoState.settingsLoaded,
    appInfoState.settings.autoScanOnStartup,
    hasScanned,
    backend,
    displayError,
  ])

  const handleAddSaves = async () => {
    setShowToast(false)
    try {
      for (const [dir, label] of Array.from(dirMap.entries())) {
        await backend.upsertSaveFolder(dir, label)
      }
      // Instruct App to refresh just in case, though savesState auto updates are usually handled implicitly or manually?
      // Since it's global, we trigger a fetch if needed, but since we are modifying via backend we can rely on standard refresh.
      backend.getSaveFolders().then(
        R.match(
          (_folders) => {
            // we could dispatch to saves context, but generally just letting the user see it in the app is enough
          },
          (err) => displayError('Error refreshing folders', err)
        )
      )
    } catch (err) {
      displayError('Failed to add detected saves', [String(err)])
    }
  }

  if (!showToast) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        maxWidth: 400,
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: 'var(--color-panel-solid)',
        border: '1px solid var(--gray-6)',
        boxShadow: '0px 2px 8px rgba(21, 21, 21, 0.12), 0px 8px 20px rgba(21, 21, 21, 0.18)',
      }}
    >
      <Callout.Root
        color="green"
        variant="surface"
        style={{
          backgroundColor: 'var(--color-panel-solid)',
          padding: 12,
        }}
      >
        <Callout.Icon>
          <InfoIcon />
        </Callout.Icon>
        <Flex gap="3" align="start">
          <Flex direction="column" gap="2" style={{ flex: 1 }}>
            <Callout.Text>
              <b>New Pokémon saves detected!</b>
              <br />
              Found {dirMap.size} new {dirMap.size === 1 ? 'emulator folder' : 'emulator folders'}.
              Would you like to add {dirMap.size === 1 ? 'it' : 'them'}?
            </Callout.Text>
            <Button
              size="1"
              onClick={handleAddSaves}
              color="green"
              variant="solid"
              style={{ alignSelf: 'flex-start' }}
            >
              Add to OpenHome
            </Button>
          </Flex>
          <button
            onClick={() => setShowToast(false)}
            style={{
              backgroundColor: 'var(--color-panel-solid)',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 3,
            }}
          >
            <ClearIcon />
          </button>
        </Flex>
      </Callout.Root>
    </div>
  )
}
