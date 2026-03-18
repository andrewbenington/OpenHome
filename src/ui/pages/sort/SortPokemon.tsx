import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { getSortFunction, SortType, SortTypes } from '@openhome-core/pkm/sort'
import { SAV } from '@openhome-core/save/interfaces'
import { filterUndefined } from '@openhome-core/util/sort'
import Autocomplete from '@openhome-ui/components/Autocomplete'
import { ClearIcon, ErrorIcon } from '@openhome-ui/components/Icons'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import PokemonDetailsModal from '@openhome-ui/pokemon-details//Modal'
import SavesModal from '@openhome-ui/saves/SavesModal'
import { useSaves } from '@openhome-ui/state/saves'
import { HomeMonLocation, SaveMonLocation } from '@openhome-ui/state/saves/reducer'
import { OriginGames } from '@pkm-rs/pkg'
import { Badge, Button, Callout, Card, Dialog, Flex, Separator } from '@radix-ui/themes'
import { useCallback, useMemo, useState } from 'react'
import { MdAdd } from 'react-icons/md'
import { useBanksAndBoxes } from '../../state-zustand/banks-and-boxes/store'
import { useOhpkmStore } from '../../state/ohpkm'
import './SortPokemon.css'

function getInnerSortFunction(
  sortStr: SortType | undefined
): (a: { mon: PKMInterface }, b: { mon: PKMInterface }) => number {
  const sortFunction = getSortFunction(sortStr)

  return (a, b) => sortFunction(a.mon, b.mon)
}

type MonWithColors = { mon: PKMInterface; color: string; isHome: boolean }

const OPENHOME_COLOR = '#7DCEAB'

export default function SortPokemon() {
  const savesAndBanks = useSaves()
  const [openSaveDialog, setOpenSaveDialog] = useState(false)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [detailsMonIndex, setDetailsMonIndex] = useState<number>()
  const [sort, setSort] = useState<SortType>()
  const ohpkmStore = useOhpkmStore()
  const banksAndBoxes = useBanksAndBoxes()

  const allMonsWithColors: MonWithColors[] = useMemo(() => {
    return savesAndBanks.allOpenSaves
      .flatMap((save) =>
        save.boxes
          .flatMap((box) => box.boxSlots)
          .filter(filterUndefined)
          .map((mon) => ({
            mon: ohpkmStore.monOrOhpkmIfTracked(mon),
            color: OriginGames.color(save.origin),
            isHome: false,
          }))
      )
      .concat(
        savesAndBanks
          .allMonsInCurrentBank()
          .map((identifier) => (identifier ? ohpkmStore.getById(identifier) : undefined))
          .filter(filterUndefined)
          .map((mon) => ({ mon, color: OPENHOME_COLOR, isHome: true }))
      )
  }, [ohpkmStore, savesAndBanks])

  const sortedMonsWithColors = useMemo(() => {
    return sort
      ? Object.values(allMonsWithColors).sort(getInnerSortFunction(sort))
      : Object.values(allMonsWithColors)
  }, [allMonsWithColors, sort])

  const toggleSelection = (i: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(i)) {
        next.delete(i)
      } else {
        next.add(i)
      }
      return next
    })
  }

  // State for the "pick a save" dialog
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)

  const [toastErrors, setToastErrors] = useState<string[] | undefined>(undefined)

  // Gather the home-stored OHPKMs among the selection
  const selectedHomeMons = useMemo(() => {
    return [...selectedIndices]
      .map((i) => sortedMonsWithColors[i])
      .filter(
        (item): item is MonWithColors & { mon: OHPKM } =>
          !!item?.isHome && item.mon instanceof OHPKM
      )
  }, [selectedIndices, sortedMonsWithColors])

  // Saves that can accept at least one of the selected mons
  const validDestSaves = useMemo(() => {
    return savesAndBanks.allOpenSaves.filter((save) =>
      selectedHomeMons.some((item) => save.supportsMon(item.mon.dexNum, item.mon.formeNum))
    )
  }, [savesAndBanks.allOpenSaves, selectedHomeMons])

  const transferToSave = useCallback(
    (targetSave: SAV) => {
      const currentFailures: string[] = []

      for (const item of selectedHomeMons) {
        const mon = item.mon
        if (!targetSave.supportsMon(mon.dexNum, mon.formeNum)) {
          currentFailures.push(`${mon.nickname || 'Pokémon'}: Not supported by target save`)
          continue
        }

        const coords = banksAndBoxes.findHomeLocation(mon.openhomeId)
        if (!coords) {
          currentFailures.push(
            `${mon.nickname || 'Pokémon'}: Could not find coordinates in OpenHome`
          )
          continue
        }

        const source: HomeMonLocation = {
          isHome: true,
          bank: coords.bank,
          box: coords.box,
          boxSlot: coords.boxSlot,
        }

        // Find first empty slot in target save
        let destBox = -1
        let destSlot = -1
        outer: for (let b = 0; b < targetSave.boxes.length; b++) {
          for (let s = 0; s < targetSave.boxes[b].boxSlots.length; s++) {
            if (!targetSave.boxes[b].boxSlots[s]) {
              destBox = b
              destSlot = s
              break outer
            }
          }
        }
        if (destBox < 0) {
          currentFailures.push(`${mon.nickname || 'Pokémon'}: No empty slots in target save`)
          continue
        }

        const dest: SaveMonLocation = {
          isHome: false,
          saveIdentifier: targetSave.identifier,
          box: destBox,
          boxSlot: destSlot,
        }

        savesAndBanks.moveMon({ ...source, mon }, dest)
      }

      if (currentFailures.length > 0) {
        setToastErrors(currentFailures)
      } else {
        setToastErrors(undefined)
      }

      setSelectedIndices(new Set())
      setTransferDialogOpen(false)
    },
    [selectedHomeMons, banksAndBoxes, savesAndBanks]
  )

  const detailsMon = useMemo(
    () => (detailsMonIndex !== undefined ? sortedMonsWithColors[detailsMonIndex]?.mon : undefined),
    [sortedMonsWithColors, detailsMonIndex]
  )

  const boxCells = useMemo(() => {
    return sortedMonsWithColors.map((monWithSave, i) => {
      const isSelected = selectedIndices.has(i)
      return (
        <div
          className="sort-mon-cell"
          style={{
            borderColor: monWithSave.color,
            backgroundColor: isSelected ? '#4ade8080' : undefined,
          }}
          key={`mon_${i}`}
        >
          <button
            onClick={(event) => {
              if (event.detail === 1) {
                toggleSelection(i)
              }
            }}
            onDoubleClick={() => setDetailsMonIndex(i)}
            className="sort-mon-button"
          >
            <PokemonIcon
              dexNumber={monWithSave.mon.dexNum}
              formeNumber={monWithSave.mon.formeNum}
              isEgg={monWithSave.mon.isEgg}
              isShiny={monWithSave.mon.isShiny()}
              style={{ width: 30, height: 30 }}
            />
          </button>
        </div>
      )
    })
  }, [sortedMonsWithColors, selectedIndices])

  return (
    <Flex direction="row" wrap="wrap" overflow="hidden" height="calc(100% - 16px)" m="2" gap="2">
      <Card style={{ height: '100%' }}>
        <Flex direction="column" gap="1" style={{ width: 180, flex: 0 }}>
          <Badge color="gray" size="3" style={{ border: `2px solid ${OPENHOME_COLOR}` }}>
            OpenHome
          </Badge>
          {savesAndBanks.allOpenSaves.map((save) => (
            <Badge
              color="gray"
              size="3"
              key={save.tid}
              style={{ border: `2px solid ${OriginGames.color(save.origin)}` }}
            >
              {save.name} ({save.tid})
            </Badge>
          ))}
          <button
            onClick={() => setOpenSaveDialog(true)}
            style={{ padding: 0, display: 'grid', justifyContent: 'center' }}
          >
            <MdAdd />
          </button>
        </Flex>
      </Card>
      <Flex direction="column" gap="2" style={{ flex: 1, height: '100%' }}>
        <Card style={{ contain: 'none' }}>
          <Flex direction="row" gap="2" align="center" wrap="wrap">
            <Autocomplete
              value={sort ?? null}
              options={SortTypes}
              onChange={(value) => setSort(value)}
              label="Sort"
              getOptionString={(opt) => opt}
              getOptionUniqueID={(opt) => opt}
            />
            {selectedIndices.size > 0 && (
              <Flex gap="3" align="center">
                <span style={{ fontSize: 12, color: '#aaa' }}>{selectedIndices.size} selected</span>
                {selectedIndices.size === 1 && (
                  <Button
                    size="1"
                    variant="soft"
                    onClick={() => setDetailsMonIndex([...selectedIndices][0])}
                  >
                    View Details
                  </Button>
                )}
                <Button
                  size="1"
                  variant="soft"
                  color="green"
                  disabled={selectedHomeMons.length === 0}
                  onClick={() => setTransferDialogOpen(true)}
                >
                  Transfer to Save
                </Button>
                <Button
                  size="1"
                  variant="ghost"
                  color="gray"
                  onClick={() => setSelectedIndices(new Set())}
                >
                  Clear
                </Button>
              </Flex>
            )}
          </Flex>
        </Card>
        <Card style={{ overflowY: 'hidden', height: '100%', padding: 0 }}>
          <Flex
            direction="row"
            wrap="wrap"
            justify="center"
            overflow="auto"
            height="calc(100% - 16px)"
            style={{ padding: 8, alignContent: 'start' }}
          >
            {boxCells}
          </Flex>
        </Card>
      </Flex>
      <SavesModal open={openSaveDialog} onClose={() => setOpenSaveDialog(false)} />
      <PokemonDetailsModal
        mon={detailsMon}
        onClose={() => setDetailsMonIndex(undefined)}
        navigateLeft={() =>
          sortedMonsWithColors.length && detailsMonIndex !== undefined
            ? setDetailsMonIndex(
                detailsMonIndex === 0 ? sortedMonsWithColors.length - 1 : detailsMonIndex - 1
              )
            : undefined
        }
        navigateRight={() =>
          sortedMonsWithColors.length && detailsMonIndex !== undefined
            ? setDetailsMonIndex((detailsMonIndex + 1) % sortedMonsWithColors.length)
            : undefined
        }
      />
      <Dialog.Root open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <Dialog.Content
          width="340px"
          style={{
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <Dialog.Title mt="2" mb="0">
            Transfer to Save
          </Dialog.Title>
          <Separator style={{ width: '100%' }} />
          {validDestSaves.length === 0 ? (
            <Dialog.Description style={{ color: '#f87171' }}>
              No open save files can accept the selected Pokémon. Open a compatible save file first.
            </Dialog.Description>
          ) : (
            <>
              <Dialog.Description>
                Choose which save to send {selectedHomeMons.length} Pokémon to:
              </Dialog.Description>
              <Flex gap="1" mt="1" direction="column">
                {validDestSaves.map((save) => (
                  <Button
                    key={save.identifier}
                    onClick={() => transferToSave(save)}
                    style={{
                      width: '100%',
                      minHeight: 36,
                      height: 'fit-content',
                      borderLeft: `4px solid ${OriginGames.color(save.origin)}`,
                    }}
                  >
                    {save.name} ({save.displayID})
                  </Button>
                ))}
              </Flex>
            </>
          )}
          <Dialog.Close>
            <Button variant="outline" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Root>

      {toastErrors && toastErrors.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
          }}
        >
          <Callout.Root variant="surface" color="red" size="2">
            <Callout.Icon>
              <ErrorIcon />
            </Callout.Icon>
            <Callout.Text>
              <Flex direction="column" gap="1">
                <strong>Failed Transfers:</strong>
                {toastErrors.map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
              </Flex>
            </Callout.Text>
            <button
              onClick={() => setToastErrors(undefined)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <ClearIcon />
            </button>
          </Callout.Root>
        </div>
      )}
    </Flex>
  )
}
