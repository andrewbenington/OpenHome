import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { getSaveRef, SAV, SaveIdentifier } from '@openhome-core/save/interfaces'
import { SAVClass } from '@openhome-core/save/util'
import { buildSaveFile, getPossibleSaveTypes } from '@openhome-core/save/util/load'
import { PathData } from '@openhome-core/save/util/path'
import { Option, R, Result } from '@openhome-core/util/functional'
import { filterUndefined } from '@openhome-core/util/sort'
import { Item } from '@pkm-rs/pkg'
import { MarkingsSixShapesWithColor } from '@pokemon-files/util'
import { useCallback, useContext, useRef } from 'react'
import { OpenHomeBanks } from 'src/core/save/HomeData'
import { displayIndexAdder, isBattleFormeItem } from '../../../core/pkm/util'
import { BackendContext } from '../../backend/backendContext'
import { useBanksAndBoxes } from '../../state-zustand/banks-and-boxes/store'
import { PokedexUpdate } from '../../util/pokedex'
import { AppInfoContext } from '../appInfo'
import { ItemBagContext } from '../items'
import { OhpkmStoreData } from '../ohpkm'
import { IdentifierNotPresentError, useOhpkmStore } from '../ohpkm/useOhpkmStore'
import {
  HomeMonLocation,
  MonLocation,
  MonWithLocation,
  OpenSavesState,
  SaveMonLocation,
  SavesContext,
} from './reducer'

export type SavesAndBanksManager = Required<Omit<OpenSavesState, 'error' | 'homeData'>> & {
  allOpenSaves: readonly SAV[]

  importMonsToLocation(mons: PKMInterface[], startingAt: MonLocation): void

  addSave(save: SAV): void
  buildAndOpenSave: (filePath?: PathData | undefined) => Promise<Result<Option<SAV>, SaveError>>
  removeSave(save: SAV): void
  saveBoxNavigateLeft(save: SAV): void
  saveBoxNavigateRight(save: SAV): void
  saveFromIdentifier: (identifier: SaveIdentifier) => SAV

  getMonAtLocation(location: MonLocation): PKMInterface | OHPKM | undefined
  setMonHeldItem(item: Item | undefined, location: MonLocation): void
  updateMonNotes(monId: string, notes: string | undefined): void
  updateMonMarkings(monId: string, markings: MarkingsSixShapesWithColor): void
  moveMon(source: MonWithLocation, dest: MonLocation): void
  recoverMonToBox(id: OhpkmIdentifier, bankIndex: number): void

  releaseMonAtLocation(location: MonLocation): void
  releaseMonsById(...ids: OhpkmIdentifier[]): void
  trackedMonsToRelease: OhpkmIdentifier[]

  moveMonItemToBag: (monLocation: MonLocation) => void
  giveItemToMon: (monLocation: MonLocation, item: Item) => void

  allMonsInCurrentBank: () => string[]
}

export function useSaves(): SavesAndBanksManager {
  const ohpkmStore = useOhpkmStore()
  const backend = useContext(BackendContext)
  const [, , getEnabledSaveTypes] = useContext(AppInfoContext)
  const { openSavesState, openSavesDispatch, allOpenSaves, promptDisambiguation } =
    useContext(SavesContext)
  const [, bagDispatch] = useContext(ItemBagContext)
  const filePickerOpen = useRef(false)
  const banksAndBoxes = useBanksAndBoxes()

  if (openSavesState.error) {
    throw new Error(`Error loading saves state: ${openSavesState.error}`)
  }
  const {
    getCurrentBank,

    getMonAtHomeLocation,
    homeLocationIsEmpty,
    clearAtHomeLocation,
    setAtHomeLocation,
    findHomeLocation,

    allMonsInCurrentBank,
    firstHomeBoxEmptySlot,
  } = banksAndBoxes

  const saveFromIdentifier = useCallback(
    (identifier: SaveIdentifier) => openSavesState.openSaves[identifier].save,
    [openSavesState.openSaves]
  )

  const getMonAtSaveLocation = useCallback(
    (location: SaveMonLocation) => {
      const save = openSavesState.openSaves[location.saveIdentifier].save
      return save.boxes[location.box].boxSlots[location.boxSlot]
    },
    [openSavesState.openSaves]
  )

  const getMonAtLocation = useCallback(
    (location: MonLocation) => {
      let identifier: OhpkmIdentifier | undefined
      if (!location.isHome) {
        const mon = getMonAtSaveLocation(location)
        if (!mon) return undefined
        return ohpkmStore.loadIfTracked(mon) ?? mon
      } else {
        identifier = getMonAtHomeLocation(location)
        if (!identifier) return undefined
        const monResult = ohpkmStore.tryLoadFromId(identifier)
        if (R.isErr(monResult)) {
          console.error('COULD NOT FIND MON WITH IDENTIFIER: ' + monResult.err.identifier)
          return undefined
        }

        return monResult.value
      }
    },
    [getMonAtHomeLocation, getMonAtSaveLocation, ohpkmStore]
  )

  const moveMonBetweenSaves = useCallback(
    (
      sourceSaveIdentifier: Option<SaveIdentifier>,
      mon: PKMInterface | undefined,
      dest: SaveMonLocation
    ): Option<PKMInterface> => {
      const sourceSave = sourceSaveIdentifier ? saveFromIdentifier(sourceSaveIdentifier) : undefined
      const destSave = openSavesState.openSaves[dest.saveIdentifier].save

      let ohpkm: Option<OHPKM>
      if (mon) {
        ohpkm =
          ohpkmStore.loadIfTracked(mon) ?? ohpkmStore.startTrackingNewMon(mon, sourceSave, destSave)
      }

      const destSaveMon = ohpkm ? ohpkmStore.updateAndConvertForSave(ohpkm, destSave) : undefined
      const displacedMon = destSave.boxes[dest.box].boxSlots[dest.boxSlot]
      destSave.boxes[dest.box].boxSlots[dest.boxSlot] = destSaveMon
      destSave.updatedBoxSlots.push({ box: dest.box, boxSlot: dest.boxSlot })

      return displacedMon
    },
    [ohpkmStore, openSavesState.openSaves, saveFromIdentifier]
  )

  const moveOhpkmToSave = useCallback(
    (
      identifier: Option<OhpkmIdentifier>,
      dest: SaveMonLocation
    ): Result<Option<PKMInterface>, IdentifierNotPresentError> => {
      const save = openSavesState.openSaves[dest.saveIdentifier].save

      if (!identifier) {
        const displacedMon = save.boxes[dest.box].boxSlots[dest.boxSlot]
        save.boxes[dest.box].boxSlots[dest.boxSlot] = undefined
        save.updatedBoxSlots.push({ box: dest.box, boxSlot: dest.boxSlot })
        return R.Ok(displacedMon)
      }

      const monResult = ohpkmStore.tryLoadFromId(identifier)
      if (R.isErr(monResult)) {
        return monResult
      }

      const ohpkm = monResult.value
      const saveFormatMon = ohpkmStore.updateAndConvertForSave(ohpkm, save)
      const displacedMon = save.boxes[dest.box].boxSlots[dest.boxSlot]
      save.boxes[dest.box].boxSlots[dest.boxSlot] = saveFormatMon
      save.updatedBoxSlots.push({ box: dest.box, boxSlot: dest.boxSlot })

      return R.Ok(displacedMon)
    },
    [ohpkmStore, openSavesState.openSaves]
  )

  const moveMonToHome = useCallback(
    <P extends PKMInterface>(
      sourceSaveIdentifier: Option<SaveIdentifier>,
      mon: Option<P>,
      location: HomeMonLocation
    ): Option<OhpkmIdentifier> => {
      const sourceSave = sourceSaveIdentifier ? saveFromIdentifier(sourceSaveIdentifier) : undefined
      const displacedMonId = getMonAtHomeLocation(location)

      let ohpkm: Option<OHPKM>
      if (mon) {
        ohpkm =
          ohpkmStore.loadIfTracked(mon) ??
          ohpkmStore.startTrackingNewMon(mon, sourceSave, undefined)
      }

      if (!mon) {
        clearAtHomeLocation(location)
      } else if (ohpkm) {
        setAtHomeLocation(location, ohpkm.openhomeId)
      }

      return displacedMonId
    },
    [clearAtHomeLocation, getMonAtHomeLocation, ohpkmStore, saveFromIdentifier, setAtHomeLocation]
  )

  const moveOhpkmToHome = useCallback(
    (
      identifier: OhpkmIdentifier | undefined,
      dest: HomeMonLocation,
      skipIfPresent: boolean = false
    ) => {
      // this is a bandaid fix for the issue of onDrop() being triggered multiple times for BoxCell. For
      // some reason it only affects the OpenHome boxes.
      if (skipIfPresent && identifier && findHomeLocation(identifier)) {
        return undefined
      }

      const displacedMonId = getMonAtHomeLocation(dest)
      if (identifier) {
        setAtHomeLocation(dest, identifier)
      } else {
        clearAtHomeLocation(dest)
      }
      return displacedMonId
    },
    [clearAtHomeLocation, findHomeLocation, getMonAtHomeLocation, setAtHomeLocation]
  )

  const importMonsToLocation = useCallback(
    (mons: PKMInterface[], startingAt: MonLocation) => {
      const addedMons: OHPKM[] = []
      const dest = startingAt

      if (dest.isHome) {
        let nextSlot = dest

        const currentBankBoxCount = getCurrentBank().boxes.size
        mons.forEach((mon) => {
          while (!homeLocationIsEmpty(nextSlot) && nextSlot.box < currentBankBoxCount) {
            nextSlot.boxSlot++
            if (nextSlot.boxSlot >= OpenHomeBanks.BOX_COLUMNS * OpenHomeBanks.BOX_ROWS) {
              nextSlot.boxSlot = 0
              nextSlot.box++
            }
          }

          if (nextSlot.box < currentBankBoxCount) {
            const homeMon = mon instanceof OHPKM ? mon : new OHPKM(mon)
            ohpkmStore.insertOrUpdate(homeMon)

            moveOhpkmToHome(homeMon.openhomeId, nextSlot, true)
            addedMons.push(homeMon)
            nextSlot.boxSlot++
            if (nextSlot.boxSlot >= OpenHomeBanks.BOX_COLUMNS * OpenHomeBanks.BOX_ROWS) {
              nextSlot.boxSlot = 0
              nextSlot.box++
            }
          }
        })
      } else {
        let nextIndex = dest.boxSlot
        const tempSave = saveFromIdentifier(dest.saveIdentifier)

        mons.forEach((mon) => {
          while (
            tempSave.boxes[dest.box].boxSlots[nextIndex] &&
            nextIndex < tempSave.boxRows * tempSave.boxColumns
          ) {
            nextIndex++
          }
          if (nextIndex < tempSave.boxRows * tempSave.boxColumns) {
            const homeMon = mon instanceof OHPKM ? mon : new OHPKM(mon)

            moveMonBetweenSaves(
              undefined,
              ohpkmStore.updateAndConvertForSave(homeMon, tempSave),
              dest
            )
            addedMons.push(homeMon)
            nextIndex++
          }
        })

        openSavesState.openSaves[dest.saveIdentifier].save = tempSave
      }

      return { ...openSavesState, openSaves: { ...openSavesState.openSaves } }
    },
    [
      getCurrentBank,
      homeLocationIsEmpty,
      moveMonBetweenSaves,
      moveOhpkmToHome,
      ohpkmStore,
      openSavesState,
      saveFromIdentifier,
    ]
  )

  const saveBoxNavigateLeft = useCallback(
    (save: SAV) => {
      openSavesDispatch({
        type: 'set_save_box',
        payload: {
          boxIndex: save.currentPCBox > 0 ? save.currentPCBox - 1 : save.boxes.length - 1,
          save,
        },
      })
    },
    [openSavesDispatch]
  )

  const saveBoxNavigateRight = useCallback(
    (save: SAV) => {
      openSavesDispatch({
        type: 'set_save_box',
        payload: {
          boxIndex: (save.currentPCBox + 1) % save.boxes.length,
          save,
        },
      })
    },
    [openSavesDispatch]
  )

  const addSave = useCallback(
    (save: SAV) => {
      backend.addRecentSave(getSaveRef(save))
      backend.registerInPokedex(pokedexSeenFromSave(save))
      if (save.trainerGender !== undefined) {
        const allOhpkms = ohpkmStore.getAllStored()
        for (const mon of allOhpkms) {
          if (!save.supportsMon(mon.dexNum, mon.formeNum)) continue

          const matchingHandler = mon.matchingUnknownHandler(save.name, save.trainerGender)
          if (!matchingHandler) continue

          mon.updateTrainerData(
            save,
            matchingHandler.friendship,
            matchingHandler.affection,
            matchingHandler.memory
          )

          ohpkmStore.insertOrUpdate(mon)
        }
      }
      const toUpdate: OhpkmStoreData = {}
      for (const mon of save.boxes.flatMap((b) => b.boxSlots).filter(filterUndefined)) {
        const trackedData = ohpkmStore.loadIfTracked(mon)
        if (trackedData) {
          trackedData.syncWithGameData(mon, save)
          toUpdate[trackedData.openhomeId] = trackedData
        }
      }

      ohpkmStore.insertOrUpdateAll(toUpdate)
      openSavesDispatch({ type: 'add_save', payload: save })
    },
    [backend, openSavesDispatch, ohpkmStore]
  )

  const buildAndOpenSave = useCallback(
    async (filePath?: PathData): Promise<Result<Option<SAV>, SaveError>> => {
      if (!filePath) {
        filePickerOpen.current = true
        const result = await backend.pickFile()
        filePickerOpen.current = false

        if (R.isErr(result)) {
          return R.Err({ type: 'SELECT_FILE', cause: result.err })
        }
        if (!result.value) return R.Ok(undefined)
        filePath = result.value
      }

      if (allOpenSaves.some((other) => other.filePath.raw === filePath.raw)) {
        return R.Err({ type: 'ALREADY_OPEN' })
      }

      const bytesResult = await backend.loadSaveFile(filePath)
      if (R.isErr(bytesResult)) {
        return R.Err({ type: 'READ_FILE', cause: bytesResult.err })
      }

      const fileBytes = bytesResult.value.fileBytes

      let saveTypes = getPossibleSaveTypes(fileBytes, getEnabledSaveTypes())

      let saveType: Option<SAVClass>
      switch (saveTypes.length) {
        case 0:
          return R.Err({ type: 'UNRECOGNIZED' })
        case 1:
          saveType = saveTypes[0]
          break
        default:
          saveType = await promptDisambiguation(saveTypes)
      }

      if (!saveType) {
        return R.Ok(undefined)
      }

      const result = buildSaveFile(filePath, fileBytes, saveType)

      if (R.isErr(result)) {
        return R.Err({
          type: 'BUILD_SAVE',
          cause: result.err,
        })
      }
      const saveFile = result.value

      if (!saveFile) {
        return R.Err({ type: 'UNRECOGNIZED' })
      } else {
        addSave(saveFile)
        return R.Ok(saveFile)
      }
    },
    [addSave, allOpenSaves, backend, getEnabledSaveTypes, promptDisambiguation]
  )

  const removeSave = useCallback(
    (save: SAV) => {
      openSavesDispatch({ type: 'remove_save', payload: save })
    },
    [openSavesDispatch]
  )

  const setMonHeldItem = useCallback(
    (item: Item | undefined, location: MonLocation) => {
      const itemIndex = item?.index ?? 0
      let ohpkm: OHPKM
      if (location.isHome) {
        const identifier = getMonAtHomeLocation(location)
        if (!identifier) return

        const result = ohpkmStore.tryLoadFromId(identifier)
        if (R.isErr(result)) {
          return result
        }

        ohpkm = result.value
      } else {
        const mon = getMonAtSaveLocation(location)
        if (!mon) return

        const save = saveFromIdentifier(location.saveIdentifier)
        ohpkm = ohpkmStore.loadIfTracked(mon) ?? ohpkmStore.startTrackingNewMon(mon, save, save)

        save.boxes[location.box].boxSlots[location.boxSlot] = save.convertOhpkm(ohpkm)
        save.updatedBoxSlots.push({ box: location.box, boxSlot: location.boxSlot })
      }

      ohpkm.heldItemIndex = itemIndex
      ohpkmStore.insertOrUpdate(ohpkm)

      return R.Ok(null)
    },
    [getMonAtHomeLocation, getMonAtSaveLocation, ohpkmStore, saveFromIdentifier]
  )

  const updateMonNotes = useCallback(
    (monId: string, notes: string | undefined) => {
      const result = ohpkmStore.tryLoadFromId(monId)
      if (R.isErr(result)) return result

      const mon = result.value
      mon.notes = notes

      ohpkmStore.insertOrUpdate(mon)
    },
    [ohpkmStore]
  )

  const updateMonMarkings = useCallback(
    (monId: string, markings: MarkingsSixShapesWithColor) => {
      const result = ohpkmStore.tryLoadFromId(monId)
      if (R.isErr(result)) return result

      const mon = result.value
      mon.markings = markings

      ohpkmStore.insertOrUpdate(mon)
    },
    [ohpkmStore]
  )

  function moveMon(source: MonLocation, dest: MonLocation) {
    if (source.isHome) {
      const sourceMonId = getMonAtHomeLocation(source)
      if (!sourceMonId) return

      if (dest.isHome) {
        const displacedMonId = moveOhpkmToHome(sourceMonId, dest)
        moveOhpkmToHome(displacedMonId, source)
      } else {
        const result = moveOhpkmToSave(sourceMonId, dest)
        if (R.isErr(result)) {
          return result
        }

        const displacedMon = result.value
        moveMonToHome(dest.saveIdentifier, displacedMon, source)
      }
    } else if (!dest.isHome && source.saveIdentifier === dest.saveIdentifier) {
      moveMonWithinSave(saveFromIdentifier(source.saveIdentifier), source, dest)
    } else {
      const sourceMon = getMonAtSaveLocation(source)
      if (!sourceMon) return

      if (dest.isHome) {
        const displacedMonId = moveMonToHome(source.saveIdentifier, sourceMon, dest)
        moveOhpkmToSave(displacedMonId, source)
      } else {
        const displacedMon = moveMonBetweenSaves(source.saveIdentifier, sourceMon, dest)
        moveMonBetweenSaves(dest.saveIdentifier, displacedMon, source)
      }
    }
  }

  const releaseMonById = useCallback(
    (id: OhpkmIdentifier) => {
      openSavesDispatch({ type: 'release_mon_by_id', payload: id })
      const location = findHomeLocation(id)
      if (location) {
        clearAtHomeLocation(location)
      }
    },
    [clearAtHomeLocation, findHomeLocation, openSavesDispatch]
  )

  const releaseMonAtLocation = useCallback(
    (location: MonLocation) => {
      if (location.isHome) {
        const identifier = moveOhpkmToHome(undefined, location)
        if (!identifier) return // slot is empty

        openSavesDispatch({
          type: 'release_mon_by_id',
          payload: identifier,
        })
      } else {
        const releasedMon = moveMonBetweenSaves(undefined, undefined, location)
        if (!releasedMon) return

        openSavesDispatch({
          type: 'release_mon_by_id',
          payload: ohpkmStore.getIdIfTracked(releasedMon) ?? releasedMon,
        })
      }
    },
    [moveMonBetweenSaves, moveOhpkmToHome, ohpkmStore, openSavesDispatch]
  )

  const releaseMonsById = useCallback(
    (...ids: OhpkmIdentifier[]) => {
      ids.forEach(releaseMonById)
    },
    [releaseMonById]
  )

  const recoverMonToBox = useCallback(
    (id: OhpkmIdentifier, boxIndex: number) => {
      const box = getCurrentBank().boxes.get(boxIndex)
      if (!box) {
        console.error(`box does not exist (index ${boxIndex})`)
        return
      }

      const firstEmptyIndex = firstHomeBoxEmptySlot(boxIndex)
      if (firstEmptyIndex === undefined) {
        console.error(`box at index ${boxIndex} is full`)
        return
      }

      setAtHomeLocation(
        { bank: getCurrentBank().index, box: boxIndex, boxSlot: firstEmptyIndex },
        id
      )
    },
    [firstHomeBoxEmptySlot, getCurrentBank, setAtHomeLocation]
  )

  const moveMonItemToBag = useCallback(
    (monLocation: MonLocation) => {
      const destMon = getMonAtLocation(monLocation)
      if (!destMon?.heldItemIndex) return
      bagDispatch({ type: 'add_item', payload: { index: destMon.heldItemIndex, qty: 1 } })
      setMonHeldItem(undefined, monLocation)
    },
    [setMonHeldItem, getMonAtLocation, bagDispatch]
  )

  const giveItemToMon = useCallback(
    (monLocation: MonLocation, item: Item) => {
      const destMon = getMonAtLocation(monLocation)
      if (!destMon) return

      bagDispatch({ type: 'remove_item', payload: { index: item.index, qty: 1 } })

      // If already holding an item, move it to the bag
      if (destMon?.heldItemIndex !== undefined) {
        bagDispatch({ type: 'add_item', payload: { index: destMon.heldItemIndex, qty: 1 } })
      }
      setMonHeldItem(item, monLocation)
    },
    [setMonHeldItem, getMonAtLocation, bagDispatch]
  )

  return {
    ...openSavesState,
    allOpenSaves,
    importMonsToLocation,

    addSave,
    buildAndOpenSave,
    removeSave,
    saveBoxNavigateLeft,
    saveBoxNavigateRight,
    saveFromIdentifier,

    getMonAtLocation,
    setMonHeldItem,
    updateMonNotes,
    updateMonMarkings,
    moveMon,
    recoverMonToBox,

    releaseMonAtLocation,
    releaseMonsById,
    trackedMonsToRelease: openSavesState.monsToRelease.filter(
      (toRelease) => typeof toRelease === 'string'
    ),

    moveMonItemToBag,
    giveItemToMon,

    allMonsInCurrentBank,
  }
}

function moveMonWithinSave(save: SAV, source: SaveMonLocation, dest: SaveMonLocation) {
  const sourceMon = save.boxes[source.box].boxSlots[source.boxSlot]
  const displacedMon = save.boxes[dest.box].boxSlots[dest.boxSlot]
  save.boxes[dest.box].boxSlots[dest.boxSlot] = sourceMon
  save.updatedBoxSlots.push({ box: dest.box, boxSlot: dest.boxSlot })
  save.boxes[source.box].boxSlots[source.boxSlot] = displacedMon
  save.updatedBoxSlots.push({ box: source.box, boxSlot: source.boxSlot })
}

export type SaveError =
  | {
      type: 'ALREADY_OPEN'
    }
  | {
      type: 'SELECT_FILE'
      cause: string
    }
  | {
      type: 'READ_FILE'
      cause: string
    }
  | {
      type: 'UNRECOGNIZED'
    }
  | {
      type: 'BUILD_SAVE'
      cause: string
    }

export type SaveErrorType = SaveError['type']

export function pokedexSeenFromSave(saveFile: SAV) {
  const pokedexUpdates: PokedexUpdate[] = []

  for (const mon of saveFile.boxes.flatMap((box) => box.boxSlots).filter(filterUndefined)) {
    pokedexUpdates.push({
      dexNumber: mon.dexNum,
      formeNumber: mon.formeNum,
      status: 'Seen',
    })

    if (isBattleFormeItem(mon.dexNum, mon.heldItemIndex)) {
      pokedexUpdates.push({
        dexNumber: mon.dexNum,
        formeNumber: displayIndexAdder(mon.heldItemIndex)(mon.formeNum),
        status: 'Seen',
      })
    }
  }

  return pokedexUpdates
}
