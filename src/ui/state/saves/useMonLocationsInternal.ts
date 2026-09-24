import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { OhpkmIdentifier } from '@openhome-core/pkm/Lookup'
import { OHPKM } from '@openhome-core/pkm/OHPKM'
import { SAV, SaveIdentifier } from '@openhome-core/save/interfaces'
import { $R, Option, PromisedResultBox, R, Result } from '@openhome-core/util/functional'
import { isThenable } from '@openhome-core/util/promise'
import {
  OPENHOME_BOX_SLOTS,
  useBanksAndBoxes,
} from '@openhome-ui/state-zustand/banks-and-boxes/store'
import { useContext } from 'react'
import { IdentifierNotPresentError, useOhpkmStore } from '../ohpkm'
import {
  EMPTY_SLOT,
  EmptySlot,
  HomeMonLocation,
  MonLocation,
  PendingMonLocation,
  SaveMonLocation,
  SavesContext,
  locationsEq,
} from './reducer'
import { DisplacedMonOpenHomeId, MovedPokemonCount, moveMonWithinSave } from './useSaves'

// this hook is only to be used by useSaves(). functions like moveMon() are safe in that they
// correctly handle swapping, but the overwrite functions and other move functions do not. The
// safe should be re-exported with useSaves(). if TypeScript had a way to only make this available
// to useSaves.ts that would be ideal
export function useMonLocationsInternal() {
  const ohpkmStore = useOhpkmStore()
  const { openSavesState, openSavesDispatch } = useContext(SavesContext)
  const banksAndBoxes = useBanksAndBoxes()

  const { getMonAtHomeLocation, clearAtHomeLocation, setAtHomeLocation, findHomeLocation } =
    banksAndBoxes

  const saveFromIdentifier = (identifier: SaveIdentifier) =>
    openSavesState.openSaves[identifier].save

  const getMonAtSaveLocation = (location: SaveMonLocation) => {
    const save = openSavesState.openSaves[location.saveIdentifier].save
    return save.getMonAt(location.box, location.boxSlot)
  }

  async function moveMon(source: MonLocation, dest: MonLocation): Promise<Result<null>> {
    if (source.isHome) {
      return dest.isHome ? moveHomeMonToHome(source, dest) : moveHomeMonToSave(source, dest)
    } else {
      return dest.isHome ? moveSaveMonToHome(source, dest) : moveSaveMonToSave(source, dest)
    }
  }

  function addPendingMonLocations(...locations: PendingMonLocation[]) {
    openSavesDispatch({ type: 'add_pending_mon_locations', payload: locations })
  }

  function removePendingMonLocations(...locations: SaveMonLocation[]) {
    openSavesDispatch({ type: 'remove_pending_mon_locations', payload: locations })
  }

  async function moveHomeMonToHome(
    source: HomeMonLocation,
    dest: HomeMonLocation
  ): Promise<Result<null>> {
    const sourceMonId = getMonAtHomeLocation(source)
    if (sourceMonId) {
      const displacedMonId = moveOhpkmToHome(sourceMonId, dest)
      moveOhpkmToHome(displacedMonId, source)
    }

    return R.Ok(null)
  }

  async function moveSaveMonToSave(
    source: SaveMonLocation,
    dest: SaveMonLocation
  ): Promise<Result<null>> {
    if (source.saveIdentifier === dest.saveIdentifier) {
      moveMonWithinSave(saveFromIdentifier(source.saveIdentifier), source, dest)
      return R.Ok(null)
    }

    const sourceMon = getMonAtSaveLocation(source)
    if (sourceMon) {
      const destSave = openSavesState.openSaves[dest.saveIdentifier].save
      const swappedMon = destSave.getMonAt(dest.box, dest.boxSlot)

      addPendingMonLocations(
        { ...source, mon: swappedMon ?? EMPTY_SLOT },
        { ...dest, mon: sourceMon }
      )

      await Promise.all([
        overwriteMonAtSaveLocation(source.saveIdentifier, sourceMon, dest),
        overwriteMonAtSaveLocation(dest.saveIdentifier, swappedMon, source),
      ])

      removePendingMonLocations(source, dest)
    }

    return R.Ok(null)
  }

  async function moveHomeMonToSave(
    source: HomeMonLocation,
    dest: SaveMonLocation
  ): Promise<Result<null>> {
    const sourceMonId = getMonAtHomeLocation(source)
    if (!sourceMonId) return R.Ok(null)

    return moveOhpkmToSave(sourceMonId, dest)
      .awaitMap((displacedMon) =>
        overwriteMonAtHomeLocation(dest.saveIdentifier, displacedMon, source).then(() => null)
      )
      .get()
  }

  async function moveSaveMonToHome(
    source: SaveMonLocation,
    dest: HomeMonLocation
  ): Promise<Result<null>> {
    const sourceMon = getMonAtSaveLocation(source)
    if (!sourceMon) return R.Ok(null)

    const displacedMonId = getMonAtHomeLocation(dest)
    return moveOhpkmToSave(displacedMonId, source)
      .awaitMap(async () => {
        await overwriteMonAtHomeLocation(source.saveIdentifier, sourceMon, dest)
        return null
      })
      .get()
  }

  const getMonAtLocation = async (location: MonLocation): Promise<Option<PKMInterface>> => {
    let identifier: OhpkmIdentifier | undefined
    if (!location.isHome) {
      const mon = getMonAtSaveLocation(location)
      if (!mon) return Promise.resolve(undefined)

      return ohpkmStore.loadIfTracked(mon).then((loaded) => loaded ?? mon)
    } else {
      identifier = getMonAtHomeLocation(location)
      if (!identifier) return Promise.resolve(undefined)

      // TODO: should this function return an error if the lookup fails? for now the error is replaced with undefined (via R.dropError())
      const result = ohpkmStore.tryLoadFromId(identifier)
      if (isThenable(result)) {
        return result.then(R.dropError)
      } else {
        return Promise.resolve($R(result).dropError())
      }
    }
  }

  function getPendingMon(
    location: SaveMonLocation
  ): Option<PKMInterface | OhpkmIdentifier | EmptySlot> {
    if (openSavesState.pendingMonLocations.length === 0) return undefined

    return openSavesState.pendingMonLocations.find((pending) => locationsEq(location, pending))?.mon
  }

  const overwriteMonAtSaveLocation = async (
    sourceSaveIdentifier: Option<SaveIdentifier>,
    sourceMon: Option<PKMInterface>,
    dest: SaveMonLocation
  ): Promise<Option<PKMInterface>> => {
    const sourceSave = sourceSaveIdentifier ? saveFromIdentifier(sourceSaveIdentifier) : undefined
    const destSave = openSavesState.openSaves[dest.saveIdentifier].save

    const convertedSourceMon = sourceMon
      ? R.after(
          ohpkmStore
            .loadOrStartTracking(sourceMon, sourceSave, destSave)
            .then((ohpkm) => ohpkmStore.updateAndConvertForSave(ohpkm, destSave))
        )
      : PromisedResultBox.ok(undefined)

    return await convertedSourceMon.then((convertedMon) => {
      const displacedMon = destSave.getMonAt(dest.box, dest.boxSlot)
      destSave.setMonAt(dest.box, dest.boxSlot, convertedMon)
      destSave.updatedBoxSlots.push({ box: dest.box, boxSlot: dest.boxSlot })
      return displacedMon
    })
  }

  function moveOhpkmToSave(
    identifier: Option<OhpkmIdentifier>,
    dest: SaveMonLocation
  ): PromisedResultBox<Option<PKMInterface>> {
    const save = openSavesState.openSaves[dest.saveIdentifier].save

    if (!identifier) {
      const displacedMon = save.getMonAt(dest.box, dest.boxSlot)
      save.setMonAt(dest.box, dest.boxSlot, undefined)
      save.updatedBoxSlots.push({ box: dest.box, boxSlot: dest.boxSlot })
      return PromisedResultBox.ok(displacedMon)
    }

    return R.after(ohpkmStore.tryLoadFromId(identifier))
      .catch(({ identifier }) => `Could not move Pokémon with id ${identifier}: OHPKM data missing`)
      .map((ohpkm) => ohpkmStore.updateAndConvertForSave(ohpkm, save))
      .then((convertedForSave) => {
        // remember the mon that was present before we update that slot
        const displacedMon = save.getMonAt(dest.box, dest.boxSlot)

        save.setMonAt(dest.box, dest.boxSlot, convertedForSave)
        save.updatedBoxSlots.push({ box: dest.box, boxSlot: dest.boxSlot })

        return displacedMon
      })
  }

  const clearMonAtSaveLocation = (
    location: SaveMonLocation
  ): Result<Option<PKMInterface>, IdentifierNotPresentError> => {
    const save = openSavesState.openSaves[location.saveIdentifier].save

    const displacedMon = save.getMonAt(location.box, location.boxSlot)
    save.setMonAt(location.box, location.boxSlot, undefined)
    save.updatedBoxSlots.push({ box: location.box, boxSlot: location.boxSlot })
    return R.Ok(displacedMon)
  }

  const overwriteMonAtHomeLocation = async <P extends PKMInterface>(
    sourceSaveIdentifier: Option<SaveIdentifier>,
    mon: Option<P>,
    location: HomeMonLocation
  ): Promise<DisplacedMonOpenHomeId> => {
    const sourceSave = sourceSaveIdentifier ? saveFromIdentifier(sourceSaveIdentifier) : undefined
    const displacedMonId = getMonAtHomeLocation(location)

    let ohpkm: Option<OHPKM>
    if (mon) {
      ohpkm = await ohpkmStore.loadOrStartTracking(mon, sourceSave, undefined)
    }

    if (!mon) {
      clearAtHomeLocation(location)
    } else if (ohpkm) {
      setAtHomeLocation(location, ohpkm.openhomeId)
    }

    return displacedMonId
  }

  const moveOhpkmToHome = (
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
  }

  const overwriteOhpkmAtLocation = async (
    location: MonLocation,
    ohpkmId: Option<OhpkmIdentifier>
  ) => {
    if (!location.isHome) {
      await moveOhpkmToSave(ohpkmId, location)
    } else {
      moveOhpkmToHome(ohpkmId, location)
    }
  }

  const moveBoxToBank = async (save: SAV): Promise<MovedPokemonCount> => {
    let movedCount = 0
    const boxSize = OPENHOME_BOX_SLOTS
    let currentBankBox = banksAndBoxes.getCurrentBox().index
    let currentSlot = 0

    while (currentBankBox < banksAndBoxes.getCurrentBank().boxes.size) {
      const emptyIndex = banksAndBoxes.firstHomeBoxEmptySlot(currentBankBox)
      if (emptyIndex !== undefined) {
        currentSlot = emptyIndex
        break
      }
      currentBankBox++
    }

    for (let boxSlot = 0; boxSlot < save.boxSlotCount; boxSlot++) {
      const mon = save.getMonAt(save.currentPCBox, boxSlot)
      if (!mon) continue

      while (currentBankBox < banksAndBoxes.getCurrentBank().boxes.size) {
        if (currentSlot < boxSize) {
          const bankSlotEmpty = banksAndBoxes.homeLocationIsEmpty({
            bank: banksAndBoxes.getCurrentBank().index,
            box: currentBankBox,
            boxSlot: currentSlot,
          })
          if (bankSlotEmpty) break
          currentSlot++
        } else {
          currentSlot = 0
          currentBankBox++
        }
      }

      if (currentBankBox >= banksAndBoxes.getCurrentBank().boxes.size) {
        banksAndBoxes.addBoxCurrentBank('end')
      }

      const ohpkm = await ohpkmStore.loadOrStartTracking(mon, save, undefined)

      banksAndBoxes.setAtHomeLocation(
        {
          bank: banksAndBoxes.getCurrentBank().index,
          box: currentBankBox,
          boxSlot: currentSlot,
        },
        ohpkm.openhomeId
      )

      save.setMonAt(save.currentPCBox, boxSlot, undefined)
      save.updatedBoxSlots.push({ box: save.currentPCBox, boxSlot: boxSlot })

      movedCount++
      currentSlot++
    }

    return movedCount
  }

  const moveSaveToBank = async (save: SAV): Promise<MovedPokemonCount> => {
    let totalMoved = 0
    let currentBankBox = banksAndBoxes.getCurrentBox().index
    let currentSlot = 0

    while (currentBankBox < banksAndBoxes.getCurrentBank().boxes.size) {
      const emptyIndex = banksAndBoxes.firstHomeBoxEmptySlot(currentBankBox)
      if (emptyIndex !== undefined) {
        currentSlot = emptyIndex
        break
      }
      currentBankBox++
    }

    for (let boxIdx = 0; boxIdx < save.getBoxCount(); boxIdx++) {
      for (let slotIdx = 0; slotIdx < save.boxSlotCount; slotIdx++) {
        const mon = save.getMonAt(boxIdx, slotIdx)
        if (!mon) continue

        while (currentBankBox < banksAndBoxes.getCurrentBank().boxes.size) {
          if (currentSlot < OPENHOME_BOX_SLOTS) {
            const bankSlotEmpty = banksAndBoxes.homeLocationIsEmpty({
              bank: banksAndBoxes.getCurrentBank().index,
              box: currentBankBox,
              boxSlot: currentSlot,
            })
            if (bankSlotEmpty) break
            currentSlot++
          } else {
            currentSlot = 0
            currentBankBox++
          }
        }

        if (currentBankBox >= banksAndBoxes.getCurrentBank().boxes.size) {
          banksAndBoxes.addBoxCurrentBank('end')
        }

        const ohpkm = await ohpkmStore.loadOrStartTracking(mon, save, undefined)

        banksAndBoxes.setAtHomeLocation(
          {
            bank: banksAndBoxes.getCurrentBank().index,
            box: currentBankBox,
            boxSlot: currentSlot,
          },
          ohpkm.openhomeId
        )

        save.setMonAt(boxIdx, slotIdx, undefined)
        save.updatedBoxSlots.push({ box: boxIdx, boxSlot: slotIdx })

        totalMoved++
        currentSlot++
      }
    }

    return totalMoved
  }

  return {
    getMonAtLocation,
    getPendingMon,
    moveOhpkmToHome,
    moveMon,

    // Bulk operations
    moveBoxToBank,
    moveSaveToBank,

    // Lossy operations
    overwriteMonAtSaveLocation,
    overwriteMonAtHomeLocation,
    overwriteOhpkmAtLocation,
    clearMonAtSaveLocation,
  }
}

export type MonLocationController = ReturnType<typeof useMonLocationsInternal>
