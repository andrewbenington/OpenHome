import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { getSortFunction, SortType, SortTypes } from '@openhome-core/pkm/sort'
import { SAV } from '@openhome-core/save/interfaces'
import { filterUndefined } from '@openhome-core/util/sort'
import { Dialog } from '@openhome-ui/components/dialog/Dialog'
import { ClearIcon, ErrorIcon } from '@openhome-ui/components/Icons'
import { GameIndicator } from '@openhome-ui/components/pokemon/indicator/GameIndicator'
import PokemonIcon from '@openhome-ui/components/PokemonIcon'
import { Typeahead } from '@openhome-ui/components/typeahead'
import PokemonDetailsModal from '@openhome-ui/pokemon-details//Modal'
import SavesModal from '@openhome-ui/saves/SavesModal'
import { getDetailsOfficialSave, getDetailsPluginSave } from '@openhome-ui/saves/util'
import { useSaves } from '@openhome-ui/state/saves'
import { HomeMonLocation, SaveMonLocation } from '@openhome-ui/state/saves/reducer'
import { OriginGames } from '@pkm-rs/pkg'
import { Badge, Button, Callout, Flex } from '@radix-ui/themes'
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
        save.getAllMons().map((mon) => {
          const backgroundColor = save.pluginIdentifier
            ? OriginGames.pluginColor(save.pluginIdentifier)
            : OriginGames.color(save.origin)
          return {
            mon: ohpkmStore.monOrOhpkmIfTracked(mon),
            color: backgroundColor,
            isHome: false,
          }
        })
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
      selectedHomeMons.some((item) => save.supportsMon(item.mon.dexNum, item.mon.formNum))
    )
  }, [savesAndBanks.allOpenSaves, selectedHomeMons])

  const transferToSave = useCallback(
    (targetSave: SAV) => {
      const currentFailures: string[] = []

      for (const item of selectedHomeMons) {
        const mon = item.mon
        if (!targetSave.supportsMon(mon.dexNum, mon.formNum)) {
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
        outer: for (let boxIndex = 0; boxIndex < targetSave.getBoxCount(); boxIndex++) {
          for (let slot = 0; slot < targetSave.boxSlotCount; slot++) {
            if (!targetSave.getMonAt(boxIndex, slot)) {
              destBox = boxIndex
              destSlot = slot
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
              if (event.altKey) {
                // If Alt is held, show details and skip selection
                setDetailsMonIndex(i)
              } else if (event.detail === 1) {
                // Regular click (no Alt) toggles selection
                toggleSelection(i)
              }
            }}
            className="sort-mon-button"
          >
            <PokemonIcon
              dexNumber={monWithSave.mon.dexNum}
              formeNumber={monWithSave.mon.formNum}
              isEgg={monWithSave.mon.isEgg}
              isShiny={monWithSave.mon.isShiny()}
              style={{ width: '80%', height: '80%' }}
            />
          </button>
        </div>
      )
    })
  }, [sortedMonsWithColors, selectedIndices])

  return (
    <div className="sort-pokemon-layout">
      <div className="card-lg-radius">
        <Flex className="sort-pokemon-saves-column">
          <Badge color="gray" size="3" style={{ border: `1px solid ${OPENHOME_COLOR}` }}>
            OpenHome Boxes
          </Badge>
          {savesAndBanks.allOpenSaves.map((save) => {
            const { backgroundColor } = save.pluginIdentifier
              ? getDetailsPluginSave(save.pluginIdentifier)
              : getDetailsOfficialSave(save.origin)
            return (
              <Badge
                color="gray"
                size="3"
                key={save.tid}
                style={{ border: `1px solid ${backgroundColor}` }}
              >
                <p>
                  {save.name} ({save.tid})
                </p>
                <div style={{ flex: 1 }} />
                <GameIndicator originGame={save.origin} plugin={save.pluginIdentifier} />
              </Badge>
            )
          })}
          <button
            onClick={() => setOpenSaveDialog(true)}
            style={{ padding: 0, display: 'grid', justifyContent: 'center' }}
          >
            <MdAdd />
          </button>
        </Flex>
      </div>
      <div className="sort-pokemon-main-content">
        <div className="card-lg-radius">
          <Flex direction="row" gap="2" align="center" wrap="wrap">
            <Typeahead<string>
              value={sort ?? null}
              options={SortTypes}
              onChange={(value) => setSort(value)}
              uniqueFieldId="sort"
              getOptionString={(opt) => opt}
              getOptionUniqueID={(opt) => opt}
              placeholder="Sort"
            />
            {selectedIndices.size > 0 ? (
              <Flex gap="3" align="center">
                <span className="faint-text">{selectedIndices.size} selected</span>
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
            ) : (
              <p className="hint faint-text">View a Pokémon's summary with alt + click</p>
            )}
          </Flex>
        </div>
        <div className="panel-lg-radius full-height no-overflow">
          <Flex className="sort-mon-grid">{boxCells}</Flex>
        </div>
      </div>
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
      <Dialog.Container open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <Dialog.Title>Transfer to Save</Dialog.Title>
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
                <TransferToSaveButton
                  key={save.filePath.raw}
                  save={save}
                  onClick={transferToSave}
                />
              ))}
            </Flex>
          </>
        )}
        <Dialog.Actions>
          <Dialog.Close>{validDestSaves.length > 0 ? 'Cancel' : 'Ok'}</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Container>

      {toastErrors && toastErrors.length > 0 && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999 }}>
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
                top: '0.5rem',
                right: '0.5rem',
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
    </div>
  )
}

type TransferToSaveButtonProps = {
  save: SAV
  onClick: (save: SAV) => void
}

function TransferToSaveButton(props: TransferToSaveButtonProps) {
  const { save, onClick } = props
  return (
    <Button className="transfer-to-save-button" key={save.identifier} onClick={() => onClick(save)}>
      <Flex direction="row" align="center" width="100%" gap="var(--padding-radius-sm-lg)">
        <b>{save.name}</b>
        <p>(TID {save.displayID})</p>
        <div style={{ flex: 1 }} />
        <GameIndicator withName originGame={save.origin} plugin={save.pluginIdentifier} />
      </Flex>
    </Button>
  )
}
