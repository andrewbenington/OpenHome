import { bytesToPKM } from '@openhome-core/pkm/FileImport'
import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { displayIndexAdder, isBattleFormeItem } from '@openhome-core/pkm/util'
import { BackendContext } from '@openhome-ui/backend/backendContext'
import {
  CtxMenuElementBuilder,
  ItemBuilder,
  LabelBuilder,
  OpenHomeCtxMenu,
  SeparatorBuilder,
} from '@openhome-ui/components/context-menu'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import useDisplayError from '@openhome-ui/hooks/displayError'
import { useItems } from '@openhome-ui/state/items'
import { MonLocation, useSaves } from '@openhome-ui/state/saves'
import { filterApplies } from '@openhome-ui/util/filter'
import { PokedexUpdate } from '@openhome-ui/util/pokedex'
import { useCallback, useContext, useMemo } from 'react'
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
}: BoxCellProps) {
  const { filter, topRightIndicator, showItem, showShiny } = useMonDisplay()
  const backend = useContext(BackendContext)
  const displayError = useDisplayError()
  const { releaseMonAtLocation } = useSaves()
  const { moveMonItemToBag } = useItems()

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

  const monCtxMenuItemBuilders = mon
    ? [
        LabelBuilder.fromComponent(
          <>
            <PokemonIcon
              dexNumber={mon?.dexNum ?? 0}
              formeNumber={mon?.formeNum}
              style={{ width: 16, height: 16 }}
            />
            {mon?.nickname}
          </>
        ),
        SeparatorBuilder,
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

  return (
    <OpenHomeCtxMenu sections={[monCtxMenuItemBuilders, ctxMenuBuilders]}>
      <div
        style={{
          padding: 0,
          width: '100%',
          aspectRatio: 1,
          borderRadius: 3,
          borderWidth: 1,
          backgroundColor: disabled || isFilteredOut ? '#555' : '#6662',
          borderColor: borderColor,
          zIndex,
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDropFromFiles(e.dataTransfer.files)
        }}
        title={disabledReason}
      >
        {mon ? (
          <DroppableSpace dropID={dragID} dropData={location} disabled={disabled}>
            <DraggableMon
              onClick={onClick}
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
  )
}

export default BoxCell
