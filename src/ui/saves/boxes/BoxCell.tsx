import { useDroppable } from '@dnd-kit/react'
import { bytesToPKM } from '@openhome-core/pkm/FileImport'
import { displayIndexAdder, isBattleFormeItem } from '@openhome-core/pkm/util'
import { BackendContext } from '@openhome/ui/backend/backendContext'
import OpenHomeCtxMenu from '@openhome/ui/components/context-menu/OpenHomeCtxMenu'
import {
  CtxMenuElementBuilder,
  ItemBuilder,
  LabelBuilder,
  SeparatorBuilder,
} from '@openhome/ui/components/context-menu/types'
import PokemonIcon from '@openhome/ui/components/PokemonIcon'
import useDisplayError from '@openhome/ui/hooks/displayError'
import { FilterContext } from '@openhome/ui/state/filter'
import { useItems } from '@openhome/ui/state/items/useItems'
import { MonLocation } from '@openhome/ui/state/saves/reducer'
import { useSaves } from '@openhome/ui/state/saves/useSaves'
import { useContext, useMemo } from 'react'
import { filterApplies } from 'src/types/Filter'
import { PKMInterface } from 'src/types/interfaces'
import { PokedexUpdate } from 'src/types/pokedex'
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

const BoxCell = ({
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
}: BoxCellProps) => {
  const [filterState] = useContext(FilterContext)
  const backend = useContext(BackendContext)
  const displayError = useDisplayError()
  const { releaseMonAtLocation } = useSaves()
  const { moveMonItemToBag } = useItems()

  const isFilteredOut = useMemo(() => {
    return (
      Object.values(filterState).some((val) => val !== undefined) &&
      (mon === undefined || !filterApplies(filterState, mon))
    )
  }, [filterState, mon])

  const onDropFromFiles = async (files: FileList) => {
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
  }

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

  const { ref } = useDroppable({
    id: dragID,
    data: location,
    disabled,
  })

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

  return (
    <OpenHomeCtxMenu sections={[monCtxMenuItemBuilders, ctxMenuBuilders]}>
      <div
        ref={ref}
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
          <DraggableMon
            onClick={onClick}
            mon={mon}
            style={{
              width: '100%',
              height: '100%',
              ...getBackgroundDetails(),
            }}
            dragData={location ? { ...location, mon } : undefined}
            dragID={dragID}
            disabled={disabled || isFilteredOut}
          />
        ) : (
          <DroppableSpace dropID={dragID} dropData={location} disabled={disabled} />
        )}
      </div>
    </OpenHomeCtxMenu>
  )
}

export default BoxCell
