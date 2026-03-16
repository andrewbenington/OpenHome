import { bytesToPKM } from '@openhome-core/pkm/FileImport'
import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { displayIndexAdder, isBattleFormeItem } from '@openhome-core/pkm/util'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import {
  CtxMenuElementBuilder,
  ItemBuilder,
  LabelBuilder,
  OpenHomeCtxMenu,
  SubmenuBuilder,
} from '@openhome-ui/components/context-menu'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { MonLocation, useSaves } from '@openhome-ui/state/saves'
import { filterApplies } from '@openhome-ui/util/filter'
import { PokedexUpdate } from '@openhome-ui/util/pokedex'
import { DISPLAY_COLOR_PRESETS, TAG_PRESETS } from '@openhome-ui/util/tags'
import { Button, Dialog, Flex, TextField } from '@radix-ui/themes'
import { useCallback, useContext, useMemo, useState } from 'react'
import { useMonDisplay } from 'src/ui/hooks/useMonDisplay'
import '../style.css'
import DraggableMon from './DraggableMon'
import DroppableSpace from './DroppableSpace'

interface BoxCellProps {
  onClick: () => void
  onDrop: (_: PKMInterface[]) => void
  disabled?: boolean
  disabledReason?: string
  zIndex: number
  mon: PKMInterface | undefined
  borderColor?: string
  dragID: string
  location: MonLocation
  ctxMenuBuilders?: CtxMenuElementBuilder[]
  isSelected?: boolean
  onToggleSelect?: () => void
  multiSelectEnabled?: boolean
}

function BoxCell({
  onClick,
  onDrop,
  disabled,
  disabledReason,
  zIndex,
  mon,
  borderColor,
  dragID,
  location,
  ctxMenuBuilders,
  isSelected,
  onToggleSelect,
  multiSelectEnabled,
}: BoxCellProps) {
  const { filter, topRightIndicator, showItem, showShiny } = useMonDisplay()
  const backend = useContext(BackendContext)
  const displayError = useDisplayError()
  const {
    releaseMonAtLocation,
    moveMonItemToBag,
    setMonNickname,
    updateMonTags,
    updateMonDisplayColor,
  } = useSaves()
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')

  const isFilteredOut = useMemo(() => {
    return (
      Object.values(filter).some((val) => val !== undefined) &&
      (mon === undefined || !filterApplies(filter, mon))
    )
  }, [filter, mon])

  const onDropFromFiles = useCallback(
    async (files: FileList) => {
      const importedMons: PKMInterface[] = []
      const pokedexUpdates: PokedexUpdate[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const bytes = new Uint8Array(await file.arrayBuffer())
        const [extension] = file.name.split('.').slice(-1)

        try {
          const mon = bytesToPKM(bytes, extension.toUpperCase())

          importedMons.push(mon)
          pokedexUpdates.push({
            dexNumber: mon.dexNum,
            formeNumber: mon.formeNum,
            status: mon.isShiny() ? 'ShinyCaught' : 'Caught',
          })

          if (isBattleFormeItem(mon.dexNum, mon.heldItemIndex)) {
            pokedexUpdates.push({
              dexNumber: mon.dexNum,
              formeNumber: displayIndexAdder(mon.heldItemIndex)(mon.formeNum),
              status: mon.isShiny() ? 'ShinyCaught' : 'Caught',
            })
          }
        } catch (e) {
          displayError('Error Importing Pokémon', `${e}`)
        }

        backend.registerInPokedex(pokedexUpdates)
      }
      onDrop(importedMons)
    },
    [backend, displayError, onDrop]
  )

  const getBackgroundDetails = () => {
    if (disabled) {
      return {
        backgroundBlendMode: 'multiply',
        backgroundColor: '#555',
      }
    }
    return {
      backgroundColor: '#0000',
    }
  }

  const openRenameDialog = useCallback(() => {
    if (!mon) return
    setRenameValue(mon.nickname)
    setRenameOpen(true)
  }, [mon])

  const confirmRename = useCallback(() => {
    if (renameValue.trim()) {
      setMonNickname(renameValue.trim(), location)
    }
    setRenameOpen(false)
  }, [renameValue, location, setMonNickname])

  const tagSubmenu = useMemo(() => {
    if (!mon || !('openhomeId' in mon)) return undefined
    const monId = (mon as any).openhomeId as string

    const builder = SubmenuBuilder.fromLabel('Set Tag')
    for (const preset of TAG_PRESETS) {
      builder.withBuilder(
        ItemBuilder.fromLabel(preset.label).withAction(() => updateMonTags(monId, [preset]))
      )
    }
    builder.withBuilder(
      ItemBuilder.fromLabel('Clear Tag').withAction(() => updateMonTags(monId, undefined))
    )
    return builder
  }, [mon, updateMonTags])

  const displayColorSubmenu = useMemo(() => {
    if (!mon || !('openhomeId' in mon)) return undefined
    const monId = (mon as any).openhomeId as string

    const builder = SubmenuBuilder.fromLabel('Set Display Color')
    for (const preset of DISPLAY_COLOR_PRESETS) {
      builder.withBuilder(
        ItemBuilder.fromLabel(preset.name).withAction(() =>
          updateMonDisplayColor(monId, preset.color)
        )
      )
    }
    builder.withBuilder(
      ItemBuilder.fromLabel('Clear Display Color').withAction(() =>
        updateMonDisplayColor(monId, undefined)
      )
    )
    return builder
  }, [mon, updateMonDisplayColor])

  const monCtxMenuItemBuilders = mon
    ? [
        LabelBuilder.fromMon(mon),
        ItemBuilder.fromLabel('Change Nickname').withAction(openRenameDialog),
        tagSubmenu,
        displayColorSubmenu,
        mon.heldItemIndex > 0
          ? ItemBuilder.fromLabel('Move Item to Bag').withAction(() => moveMonItemToBag(location))
          : undefined,
        ItemBuilder.fromLabel('Move To Release Area').withAction(() =>
          releaseMonAtLocation(location)
        ),
      ]
    : undefined

  const dragData = useMemo(
    () => (location && mon ? { ...location, mon } : undefined),
    [location, mon]
  )

  const cellBackgroundColor = useMemo(() => {
    if (disabled || isFilteredOut) return '#555'
    if (isSelected) return '#4ade8080'
    if (mon?.displayColor) return mon.displayColor
    return '#6662'
  }, [disabled, isFilteredOut, isSelected, mon?.displayColor])

  const handleClick = useCallback(() => {
    if (multiSelectEnabled && mon && onToggleSelect) {
      onToggleSelect()
    } else {
      onClick()
    }
  }, [multiSelectEnabled, mon, onClick, onToggleSelect])

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      if (multiSelectEnabled && e.buttons === 1 && mon && onToggleSelect && !isSelected) {
        onToggleSelect()
      }
    },
    [multiSelectEnabled, mon, onToggleSelect, isSelected]
  )

  return (
    <>
      <OpenHomeCtxMenu sections={[monCtxMenuItemBuilders, ctxMenuBuilders]}>
        <div
          style={{
            padding: 0,
            width: '100%',
            aspectRatio: 1,
            borderRadius: 3,
            borderWidth: 1,
            backgroundColor: cellBackgroundColor,
            borderColor: isSelected ? '#4ade80' : borderColor,
            zIndex,
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDropFromFiles(e.dataTransfer.files)
          }}
          onMouseEnter={handleMouseEnter}
          title={disabledReason}
        >
          {mon ? (
            <DroppableSpace dropID={dragID} dropData={location} disabled={disabled}>
              <DraggableMon
                onClick={handleClick}
                mon={mon}
                style={{
                  width: '100%',
                  height: '100%',
                  ...getBackgroundDetails(),
                }}
                dragData={dragData}
                dragID={dragID}
                disabled={disabled || isFilteredOut}
                topRightIndicator={topRightIndicator}
                showItem={showItem}
                showShiny={showShiny}
              />
            </DroppableSpace>
          ) : (
            <DroppableSpace dropID={dragID} dropData={location} disabled={disabled} />
          )}
        </div>
      </OpenHomeCtxMenu>
      <Dialog.Root open={renameOpen} onOpenChange={setRenameOpen}>
        <Dialog.Content maxWidth="360px" style={{ padding: 16, borderRadius: 8 }}>
          <Flex direction="column" gap="1">
            <Dialog.Title>Rename {mon?.speciesMetadata?.name ?? 'Pokémon'}</Dialog.Title>
            <Dialog.Description>Enter a nickname for this Pokémon</Dialog.Description>
          </Flex>

          <Flex direction="column" gap="3" mt="3">
            <TextField.Root
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder={mon?.nickname}
            />

            <Flex gap="2" justify="end">
              <Button variant="soft" color="gray" onClick={() => setRenameOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmRename}>Save</Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  )
}

export default BoxCell
