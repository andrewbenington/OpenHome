import useBackend from '@openhome-core/backend/useBackend'
import { bytesToPKM } from '@openhome-core/pkm/FileImport'
import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { displayIndexAdder, isBattleFormeItem } from '@openhome-core/pkm/util'
import {
  CtxMenuElementBuilder,
  Item,
  Label,
  OpenHomeCtxMenu,
  Submenu,
} from '@openhome-ui/components/context-menu'
import { Dialog } from '@openhome-ui/components/dialog/Dialog'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { useMonDisplay } from '@openhome-ui/hooks/monDisplay'
import { useOhpkmStore } from '@openhome-ui/state/ohpkm'
import { MonLocation, useSaves } from '@openhome-ui/state/saves'
import { filterApplies } from '@openhome-ui/util/filter'
import { PokedexUpdate } from '@openhome-ui/util/pokedex'
import { DISPLAY_COLOR_PRESETS, TAG_PRESETS } from '@openhome-ui/util/tags'
import { Lookup } from '@pkm-rs/pkg'
import { Flex, TextField } from '@radix-ui/themes'
import { useCallback, useMemo, useState } from 'react'
import '../style.css'
import DraggableMon from './DraggableMon'
import DroppableSpace from './DroppableSpace'

type MonWithOpenHomeId = PKMInterface & { openhomeId: string }

function hasOpenHomeId(mon: PKMInterface): mon is MonWithOpenHomeId {
  return typeof (mon as { openhomeId?: unknown }).openhomeId === 'string'
}

interface BoxCellProps {
  onClick: () => void
  onDrop: (_: PKMInterface[]) => void
  disabled?: boolean
  disabledReason?: string
  mon: PKMInterface | undefined
  borderColor?: string
  dragID: string
  location: MonLocation
  contextMenu?: CtxMenuElementBuilder[]
  isSelected?: boolean
  onToggleSelect?: () => void
  multiSelectEnabled?: boolean
}

function BoxCell(props: BoxCellProps) {
  const { onClick, onDrop, disabled, disabledReason, mon, borderColor, dragID } = props
  const { location, isSelected, onToggleSelect, multiSelectEnabled } = props
  const { filter, topRightIndicator, showItem, showShiny } = useMonDisplay()
  const backend = useBackend()
  const displayError = useDisplayError()
  const { releaseMonAtLocation, moveMonItemToBag } = useSaves()
  const { updateMonTags, updateMonDisplayColor, setMonNickname } = useOhpkmStore()
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const { showBackgroundColor } = useMonDisplay()

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
            formIndex: mon.formNum,
            status: mon.isShiny() ? 'ShinyCaught' : 'Caught',
          })

          if (isBattleFormeItem(mon.dexNum, mon.heldItemIndex)) {
            pokedexUpdates.push({
              dexNumber: mon.dexNum,
              formIndex: displayIndexAdder(mon.heldItemIndex)(mon.formNum),
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
    setRenameValue(mon.isNicknamed ? mon.nickname : '')
    setRenameOpen(true)
  }, [mon])

  const confirmRename = useCallback(() => {
    if (!(mon instanceof OHPKM)) return
    setMonNickname(
      mon.openhomeId,
      renameValue.trim() || Lookup.speciesName(mon.dexNum, mon.language)
    )
    setRenameOpen(false)
  }, [renameValue, setMonNickname, mon])

  const tagSubmenu = useMemo(() => {
    if (!mon || !hasOpenHomeId(mon)) return undefined
    const monId = mon.openhomeId

    const builder = Submenu.label('Set Tag')
    for (const preset of TAG_PRESETS) {
      builder.with(Item.label(preset.label).action(() => updateMonTags(monId, [preset])))
    }
    builder.with(Item.label('Clear Tag').action(() => updateMonTags(monId, undefined)))
    return builder
  }, [mon, updateMonTags])

  const displayColorSubmenu = useMemo(() => {
    if (!mon || !hasOpenHomeId(mon)) return undefined
    const monId = mon.openhomeId

    const builder = Submenu.label('Set Display Color')
    for (const preset of DISPLAY_COLOR_PRESETS) {
      builder.with(Item.label(preset.name).action(() => updateMonDisplayColor(monId, preset.color)))
    }
    builder.with(
      Item.label('Clear Display Color').action(() => updateMonDisplayColor(monId, undefined))
    )
    return builder
  }, [mon, updateMonDisplayColor])

  const contextMenuItems = mon
    ? [
        Label.mon(mon),
        Item.label('Change Nickname').action(openRenameDialog),
        tagSubmenu,
        displayColorSubmenu,
        mon.heldItemIndex > 0
          ? Item.label('Move Item to Bag').action(() => moveMonItemToBag(location))
          : undefined,
        Item.label('Move To Release Area').action(() => releaseMonAtLocation(location)),
      ]
    : undefined

  const dragData = useMemo(
    () => (location && mon ? { ...location, mon } : undefined),
    [location, mon]
  )

  const cellBackgroundColor = useMemo(() => {
    if (disabled || isFilteredOut) return '#555'
    if (isSelected) return '#4ade8080'
    if (mon?.displayColor && showBackgroundColor) return mon.displayColor
    return '#6662'
  }, [disabled, isFilteredOut, isSelected, mon?.displayColor, showBackgroundColor])

  const handleClick = useCallback(() => {
    if (multiSelectEnabled && mon && onToggleSelect) {
      onToggleSelect()
    } else {
      onClick()
    }
  }, [multiSelectEnabled, mon, onClick, onToggleSelect])

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      if (
        !dragData &&
        multiSelectEnabled &&
        e.buttons === 1 &&
        mon &&
        onToggleSelect &&
        !isSelected
      ) {
        onToggleSelect()
      }
    },
    [dragData, multiSelectEnabled, mon, onToggleSelect, isSelected]
  )

  return (
    <>
      <OpenHomeCtxMenu sections={[contextMenuItems, props.contextMenu]}>
        <div
          style={{
            padding: 0,
            width: '100%',
            aspectRatio: 1,
            borderRadius: 3,
            borderWidth: 1,
            backgroundColor: cellBackgroundColor,
            borderColor: isSelected ? '#4ade80' : borderColor,
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
                isSelected={isSelected}
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
      {mon instanceof OHPKM && (
        <Dialog.Container open={renameOpen} onOpenChange={setRenameOpen}>
          <Dialog.Title>Rename {mon.nickname}</Dialog.Title>
          <Dialog.Description>Enter a nickname for this Pokémon</Dialog.Description>
          <Flex direction="column" gap="3" mt="3">
            <TextField.Root
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder={Lookup.speciesName(mon.dexNum, mon.language)}
            />
            <Dialog.Actions>
              <Dialog.Close>Cancel</Dialog.Close>
              <Dialog.Action onClick={() => setRenameValue('')}>Reset</Dialog.Action>
              <Dialog.Close color="theme" onClick={confirmRename}>
                Save
              </Dialog.Close>
            </Dialog.Actions>
          </Flex>
        </Dialog.Container>
      )}
    </>
  )
}

export default BoxCell
